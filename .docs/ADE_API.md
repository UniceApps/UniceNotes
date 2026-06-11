# Documentation officielle de l'API ADE

À l'aide de l'API d'ADE, il est possible de récupérer les créneaux pour une journée, mais aussi pour une promotion voulue.

## CONNECT
Se connecter à une session et ainsi récupérer un sessionId.

`https://adresse-ade/jsp/webapi?function=connect&login=xxxxxxxxxxxxx&password=xxxxxxxxxxxxx`

```
Params :

function → connect
login → l’identifiant de l’utilisateur
password → le mot de passe de l’utilisateur
```

## DISCONNECT
Se déconnecter à une session.

`https://adresse-ade/jsp/webapi?sessionId=xxxxxxxxxxxxx&function=disconnect`

```
Params :

function → disconnect
sessionId → l’ID de la session
```

## GETPROJECTS
Récupérer les projets

`https://adresse-ade/jsp/webapi?sessionId=xxxxxxxxxxxxx&function=getProjects`

```
Params :

function → getProjects
sessionId → l’ID de la session
```

## SETPROJECT
Accèder à un projet

`https://adresse-ade/jsp/webapi?sessionId=xxxxxxxxxxxxx&function=setProject&projectId=5`

```
Params :

function → setProject
sessionId → l’ID de la session
projectId → l’ID du projet
```

## GETRESOURCES
Récupérer les ressources

`https://adresse-ade/jsp/webapi?sessionId=xxxxxxxxxxxxx&function=getResources&name=EP3&detail=3`

```
Params :

function → getResources
sessionId → l’ID de la session
name (optionnel) → nom de la ressource
id (optionnel) → l’ID de la ressource
detail (optionnel) → le niveau de détail (voir ci-dessous)
Autres paramètres optionnels : tree, folders, leaves, category, type, email, url, size, quantity, code, address1, address2, zipCode, state, city, country, telephone, fax, timezone, jobCategory, manager, codeX, codeY, codeZ, info
```

Exemple d’une ressource :

```xml
<resources>
        <resource id="1179" name="EP3" path="EP." category="category5"/>
</resources>
```

## GETEVENTS
Récupérer les évennements de la journée

`https://adresse-ade/jsp/webapi?sessionId=xxxxxxxxxxxxx&function=getEvents&date=05/02/2023&detail=0``

```
Params :

function → getEvents
sessionId → l’ID de la session
eventId (optionnel) → l’ID de l’évent
date (optionnel) → la date au format mm/dd/yyyy
detail (optionnel) → le niveau de détail (voir ci-dessous)
resources (optionnel) → l’ID des ressources espacé par « | »
````

Dans un event, on peut retrouver ⇒

le nom du cours
Horaire de début/fin

Les ressources :
nom de la ressource ( STPI12-TP-G2 /  NOM Prénom /  Amphi S – ESITECH /  STPI1 ...)

categorie :
trainee = étudiants
instructor = enseignants
classroom = la salle
category5 = groupe

Exemple d’un event :

```xml
<events>
    <event id="24412" activityId="10003" session="0" repetition="0" name="STPI12-C2-CM-2-1" endHour="09:30" startHour="08:00" date="02/05/2023" absoluteSlot="14722" slot="4" day="1" week="37" additionalResources="0" duration="6" info="AMPHI S" note="1679982923895" color="255,255,255" isLockPosition="false" oldDuration="6" oldSlot="4" oldDay="1" oldWeek="39" lastUpdate="02/10/2023 09:37" creation="02/03/2023 17:31" isLockResources="false" isSoftKeepResources="false" isNoteLock="false" isStrongLock="false">
        <resources>
            <resource fromWorkflow="false" nodeId="50514" nodeOrId="-1" quantity="1" category="trainee" name="STPI12-TP-E1" id="2286"/>
            <resource fromWorkflow="false" nodeId="50515" nodeOrId="-1" quantity="1" category="trainee" name="STPI12-TP-E2" id="2287"/>
            <resource fromWorkflow="false" nodeId="50516" nodeOrId="-1" quantity="1" category="trainee" name="STPI12-TP-F1" id="2288"/>
            <resource fromWorkflow="false" nodeId="50517" nodeOrId="-1" quantity="1" category="trainee" name="STPI12-TP-F2" id="2289"/>
            <resource fromWorkflow="false" nodeId="50518" nodeOrId="-1" quantity="1" category="trainee" name="STPI12-TP-G1" id="2290"/>
            <resource fromWorkflow="false" nodeId="50519" nodeOrId="-1" quantity="1" category="trainee" name="STPI12-TP-G2" id="2291"/>
            <resource fromWorkflow="false" nodeId="50520" nodeOrId="-1" quantity="1" category="trainee" name="STPI12-TP-H1" id="2292"/>
            <resource fromWorkflow="false" nodeId="50521" nodeOrId="-1" quantity="1" category="trainee" name="STPI12-TP-H2" id="2293"/>
            <resource fromWorkflow="false" nodeId="50522" nodeOrId="-1" quantity="1" category="instructor" name="NOM Prénom" id="641"/>
            <resource fromWorkflow="false" nodeId="49899" nodeOrId="-1" quantity="1" category="classroom" name="Amphi S - ESITECH" id="1596"/>
            <resource fromWorkflow="false" nodeId="50523" nodeOrId="-1" quantity="1" category="category5" name="STPI1" id="1171"/>
        </resources>
        <additional/>
    </event>
</events>
```

Le paramètre détail permet de spécifier le niveau de détail de la trame xml retournée :

```
1: id
2: & name
3: & type & folderId
4: & url
5: & size
6: & repetition
7: & duration & nbEventsPlaced & durationInMinutes & firstWeek & firstDay & firstSlot & lastWeek & lastDay & lastSlot & creation & lastUpdate
8: & email
9: & color & code & timezone & codeX & codeY & codeZ & info & maxSeats & seatsLeft & weight
10: & isActive
11: & isNotSameDay
12: & isGrouped
13: & isAligned & isSuccessiveDay
14: & rights & owner
15: & resources
16 or 0: & resource costs
17: & events of the activity
```