# NSF Prototype

Current deployment link: [https://nsf-prototype.netlify.app](https://nsf-prototype.netlify.app)

## Overview

This project, in its current state, serves as a proof of concept to investigate how city planners could potentially identify wrongful evictions at CARES Act properties in the metro Atlanta area.

## Project Management

Navigate to the project board by clicking on the projects tab at the top of this page. You can also follow [this](https://github.com/orgs/Eviction-Data-Research/projects/1) link.

## Architecture

### Frontend

The client-side of the prototype is written in React using [Vite](https://vitejs.dev/).

Frontend code can be found in the `client` directory.

### Backend

The API for the prototype is served by [FastAPI](https://fastapi.tiangolo.com/), an API framework for Python.

All code related to the backend is located in the `server` directory.

### Database

At the core of this project is the geospatial database that powers the user's operations on eviction data. [PostGIS](https://postgis.net/documentation/getting_started/), an extension on top of [PostgreSQL](https://www.postgresql.org/), is responsible for this layer.

Database-related files are located in the `db` directory.

## Running the project locally

Before continuing, clone this repository. It is strongly recommended that you go through the following sections in the order they are written, as the frontend is dependent on the backend, and the backend is dependent on the database.

If you intend on using Docker for any local setup steps, install [Docker Desktop](https://www.docker.com/products/docker-desktop/) on your machine.

### Database

You have 2 options in setting up the database. You can either **1. utilize Docker and use the prewritten Docker Compose service**, or you can **2. locally install PostgreSQL and PostGIS**. If you already have PostgreSQL installed, doing option 2 is recommended. Otherwise, consider following option 1.

#### Option 1: Docker

1. From the root of the repository, run:

   ```zsh
   docker compose up -f docker-compose-dev.yml --build
   ```

   This should build and run your database service.

2. Test your connection using a tool like DataGrip or pgAdmin. Ensure that your database is named `nsf-prototype` and that you have tables named `cares` and `counties`.

#### Option 2: Manual installation

1. Install [PostgreSQL](https://www.postgresql.org/download/) if you haven't already.

2. Create a database with the name `nsf-prototype`.

3. Follow the PostGIS [installation guide](https://postgis.net/documentation/getting_started/) to extend the `nsf-prototype` database with geospatial capabilities.

4. Navigate to `db/seed` and run the following to seed your new database:

   ```
   psql -d nsf-prototype -f dump.sql
   ```

5. Test your connection using a tool like DataGrip or pgAdmin. Ensure that your database is named `nsf-prototype` and that you have tables named `cares` and `counties`.

### Backend

For the backend, it is recommended that you manually set up the backend environment instead of using Docker.

1. Install Python 3.12.

2. Navigate to the `server` directory.

3. Run `pip install -r requirements.txt`. This should install all backend dependencies. If you'd like, you can run this command after creating a venv.

4. Create a file named `.env`, and paste in the following contents:

   ```
   DB_URL=postgresql://postgres@localhost/nsf-prototype
   ```

   Replace the credential fields as necessary, following the URI schema

   `postgresql://[username[:password]@][host[:port],]/database`

5. Run `uvicorn src.main:app --reload --port 8443`. Your backend API should now be listening to requests on localhost:8443.

### Frontend

It is recommended that you manually set up the client-side environment instead of using Docker. Generally, performance and hot module reload seem to be much better when Docker isn't used to serve the frontend on your local machine.

1. Install [node 18](https://nodejs.org/en/download/package-manager).

2. Navigate to the `client` directory.

3. Run `npm install`.

4. Create a file named `.env.local` within the `client` directory. Copy the snippet below and paste it into the file.

   ```
   VITE_BACKEND_URL=http://localhost:8443
   ```

5. Run `npm run dev`. Vite should spin up a development server for you. Follow the localhost URL that Vite provides you to view the website.

## Deployment

There are **three** major steps to properly deploying all aspects of this service to the cloud.

As this prototype is currently a proof of concept, there are no robust pipelines for maintaining cloud "production" environments. As such, existing deployments were set up using personal accounts on various cloud platforms. During the prototyping stage, deployments require manual work such as pulling the newest changes from the remote repository on the VM and re-launching the service. Similarly, there is currently no mechanism to log issues as they occur in real-time.

Because the previous deployments to this prototype were performed ad hoc, it is necessary to go through all the deployment steps again on a separate account. The accounts across multiple cloud providers (Cloudflare, AWS, Netlify) responsible for hosting the existing deployments will be inaccessible to you.

### Domain management

To properly query data on the frontend from your deployed backend environment, a custom domain is required to proxy and encrypt traffic between your frontend and backend endpoints.

Currently, a personal domain has been set up for this purpose using Cloudflare DNS, with an `A` DNS record pointing the `nsf` subdomain to public IP address of the backend VM deployment. Ensure that the traffic is proxied and encrypted using SSL. **Without this step, requests made to your backend server will not use HTTPS.** This can prevent the website from working as intended.

### Database and backend

Currently, the database and backend in the cloud environment live together on the same virtual machine, meaning that they share the same compute resources. Follow the steps below to deploy the database and the backend:

1. Set up a virtual machine on a cloud provider with at least 2 CPU cores and 4GB of memory. You can consider using AWS EC2, GCP Compute Engine, DigitalOcean Droplets, etc. To ensure compatibility, ensure that the operating system is Ubuntu running on x86.

2. Ensure that port 8443 is open to external traffic. This is the port that your frontend will use to hit your API endpoints.

3. SSH into your cloud environment and install the [Docker Engine](https://docs.docker.com/engine/install/ubuntu/#install-using-the-repository) using `apt`.

4. Clone this repository on your virtual machine.

5. Navigate to the `server` directory.

6. Run the following command:

   ```
   openssl req -x509 -newkey rsa:4096 -nodes -out cert.pem -keyout key.pem -days 365
   ```

   You should now see files `cert.pem` and `key.pem` in your `server` directory. These are important in ensuring an SSL-encrypted connection (HTTPS) to your API.

7. Navigate back to the root directory of this project. Run the following command.

   ```
   docker compose up -d --build -f docker-compose.yml
   ```

   You should now be serving the backend API and database on your virtual machine.

### Frontend

At the time of writing, the frontend is hosted on [Netlify](https://www.netlify.com/) for free as part of their free tier. There are many other services that offer the same guarantees as Netlify, such as Vercel, Render, etc. When making your own deployments to the frontend, ensure that your environment variables are referencing the production deployment of your backend.
