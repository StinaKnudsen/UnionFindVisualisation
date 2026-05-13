# Visualisation of different Union Find Implementations

Bachelor project in BSc Software Development at the IT University of Copenhagen in Spring 2026

## How to run the project

To run the application locally, two terminal instances are required — one for the backend and one for the frontend.

### Backend

Navigate to the `/backend` directory and run the command:

```bash
dotnet run
```

### Frontend

Navigate to the `/frontend` directory, install the dependencies:
```bash
npm install
```
Then run the command
```bash
npm run dev
```

Once running, a local development URL will appear in the terminal. Click it to open the web application in your browser.

## How to run test

### Backend

Navigate to the `/backend` directory:

```bash
dotnet test
```
Generate testing report:
```bash
dotnet test --collect:"XPlat Code Coverage" --settings coverlet.runsettings

reportgenerator -reports:"TestResults/**/coverage.cobertura.xml" -targetdir:"coverage-report" -reporttypes:Html
```

Open testing report:

Mac:
```bash
open coverage-report/index.html
```

Windows:
```
start coverage-report/index.html
```


### Frontend

Navigate to the `/frontend` directory:

```bash
npm test
```
Generate testing report:
```bash
npm run coverage
```

## Authors
- Alberte Bülow [@AVNBuelow](https://github.com/AVNBuelow)
- Oline Scharling Krebs [@olinesk](https://github.com/olinesk)
- Stina Knudsen [@StinaKnudsen](https://github.com/StinaKnudsen)
