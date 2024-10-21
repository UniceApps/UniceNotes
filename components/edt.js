// JS module to handle iCal API fetching and parsing in React Native
import ICAL from "ical.js";

class EDT {  
  constructor() {
    this,READY = false;
    new EDTConfig().getConfig().then(projectId => {
      this.ADE_PROJECT = projectId;
      this.READY = true;
    }).catch(error => {
      console.error("Error fetching project ID:", error);
      this.ADE_PROJECT = null;
    });
    this.ADE_DATE = new EDTDate().ADE_DATE;
  }

  async fetchEDT(adeid) {
    if (!adeid) {
      throw new Error("ADEID manquant");
    }

    if (adeid === "demo") {
      adeid = "vermaelen@unice.fr";
    }

    try {
      const response = await fetch(`https://edtweb.univ-cotedazur.fr/jsp/custom/modules/plannings/anonymous_cal.jsp?code=${adeid}&projectId=${this.ADE_PROJECT}&calType=ical${this.ADE_DATE}`, { 
        method: 'GET', 
        timeout: 3000 
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des données");
      }

      const icalData = await response.text();
      return icalData;

    } catch (error) {
      return [{
        id: 0,
        summary: "ADE Indisponible",
        location: "Emplois du temps indisponibles.",
        description: "",
        start_time: new Date().toISOString(),
        end_time: new Date(new Date().getTime() + 60 * 60 * 1000).toISOString()
      }];
    }
  }

  async getEDT(adeid) {
    try {
      let events = await this.fetchEDT(adeid);
      return this.parseICal(events);
    } catch (error) {
      return [{
        id: 0,
        summary: "ADE Indisponible",
        location: "Emplois du temps indisponibles.",
        description: "",
        start_time: new Date().toISOString(),
        end_time: new Date(new Date().getTime() + 60 * 60 * 1000).toISOString()
      }];
    }
  }

  async getNextEvent(adeid) {
    try {
      let icalData = await this.fetchEDT(adeid);
      const nextEvent = this.findNextEvent(icalData);

      if (!nextEvent) {
        return {
          summary: "Non disponible",
          location: "Pas de cours en vue :)"
        };
      }

      return nextEvent;

    } catch (error) {
      return {
        summary: "ADE Indisponible",
        location: "Emplois du temps indisponibles."
      };
    }
  }

  // Méthode pour analyser et trouver le prochain événement
  findNextEvent(icalData) {
    const events = this.parseICal(icalData);
    const now = new Date();
    let nextEvent = null;

    events.forEach(event => {
      const startTime = new Date(event.start_time);

      // Si l'événement commence après l'heure actuelle et est dans les 15 prochaines minutes
      if (startTime > new Date(now.getTime() - 15 * 60 * 1000)) {
        if (!nextEvent || new Date(nextEvent.start_time) > startTime) {
          nextEvent = event;
        }
      }
    });

    return nextEvent;
  }

  parseICal(icalData) {
    const events = [];
    let id = 0;

    const jcalData = ICAL.parse(icalData);
    const comp = new ICAL.Component(jcalData);

    comp.getAllSubcomponents("vevent").forEach(subcomp => {
      const event = new ICAL.Event(subcomp);

      const summary = event.summary;
      const location = event.location;
      const description = event.description;
      const start_time = event.startDate.toJSDate().toISOString();
      const end_time = event.endDate.toJSDate().toISOString();

      events.push({ id, summary, location, description, start_time, end_time });
      id++;
    });

    return events;
  }
}

class EDTConfig {

  constructor() {
    this.BASE_URL = "https://edtweb.univ-cotedazur.fr/jsp/webapi";
  }

  // Helper function to extract the attribute of a tag from an XML string
  extractAttributeValue(xmlString, tagName, attributeName) {
    const regex = new RegExp(`<${tagName}[^>]*${attributeName}="(.*?)"`, "i");
    const match = xmlString.match(regex);
    return match ? match[1] : null;
  }

  // Function to log in and get session ID
  async getSessionId() {
    try {
      const response = await fetch(`${this.BASE_URL}?function=connect&login=Individuel&password=`);
      
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      
      const textResponse = await response.text();

      // Manually extract the session ID from the XML response
      const sessionId = this.extractAttributeValue(textResponse, "session", "id");

      return sessionId;
    } catch (error) {
      console.error("Error getting session ID:", error);
      return null;
    }
  }

  // Function to fetch projects using the session ID
  async getProjects(sessionId) {
    try {
      const response = await fetch(`${this.BASE_URL}?function=getProjects&sessionId=${sessionId}&detail=2`);

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const textResponse = await response.text();

      fetch(`${this.BASE_URL}?function=disconnect&sessionId=${sessionId}`);

      // Manually parse the project list from the XML response
      const projectRegex = /<project[^>]*id="(.*?)"[^>]*name="(.*?)"[^>]*>/gi;
      const currentYear = new Date().getFullYear();
      let selectedProjectId = null;

      let match;
      while ((match = projectRegex.exec(textResponse)) !== null) {
        const projectId = match[1];
        const projectName = match[2];

        // Check if the project name contains the current year and "Prod"
        if (projectName.includes(currentYear.toString()) && projectName.includes("Prod")) {
          selectedProjectId = projectId;
          break;
        }
      }

      if (selectedProjectId) {
        return selectedProjectId;
      } else {
        console.log("No matching project found for the current year and 'Prod'");
        return null;
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      return null;
    }
  }

  // Main function to execute the login and project fetching
  async getConfig() {
    const sessionId = await this.getSessionId();
    
    if (sessionId) {
      const projectId = await this.getProjects(sessionId);

      if (projectId) {
        return projectId;
      }
    }
  }
}

class EDTDate {
  constructor() {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); // 0 = January, 11 = December
    
    let firstDate, lastDate;
    
    if (currentMonth >= 8) { // September (8) or later
        firstDate = currentYear + "-09-01";
        lastDate = (currentYear + 1) + "-08-31";
    } else { // Before September
        firstDate = (currentYear - 1) + "-09-01";
        lastDate = currentYear + "-08-31";
    }

    this.ADE_DATE = "&firstDate=" + firstDate + "&lastDate=" + lastDate;
  }
}

export default EDT;