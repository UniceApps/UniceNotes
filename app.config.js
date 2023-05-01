module.exports = ({ config }) => {
    return {
        ...config,
        extra: {
            eas: {
              projectId: "ec0ebd57-7227-4cd2-a71e-344e0a5fffe5"
            },
            bugsnag: {
              apiKey: process.env.BUGSNAG_API
            }
        }
    };
};
