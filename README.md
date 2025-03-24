# Peachtree Bank Application
This is a POC build using TS (ui) and .Net 9 (api) to demonstrate a simple transaction application.)

## Getting Started
Just head to https://peachtree-bank-app.vercel.app/ and login using your provided credentials by email.
There are already some transactions in the system, but you can add more by clicking on the "Add Transaction" button.
The frontend is hosted on Vercel.
The backend is hosted on Azure and api docs are accessible on https://peachtree-api.azurewebsites.net/swagger/index.html.

## Running the application locally
You'll need to have Docker installed on your machine.
just run the following commands:
`docker-compose up`

## Running the application locally without Docker
You'll need to have .Net 9 and Node.js installed on your machine.
1. Run the backend: ```cd src/api && dotnet run```
2. Run the frontend: ```cd src/ui && npm install && npm start```