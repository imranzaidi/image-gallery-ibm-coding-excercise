# Image Gallery Coding Excercise

This demo application queries Flickr's API for information about public photos of NASA's user account and demonstrates how the [MEANjs stack (v0.4.2)](http://meanjs.org/) can be used to prototype an image gallery. To avoid any policy or compliance issues, data is not stored locally on the server and no images are cached either. It can certainly be enhanced to use MongoDB for persistent storage and redis as a job queue periodically fetching additional information and caching high res images assuming the backend is running on a server with sufficient space.

## Getting up and running
As state earlier, this application is built using four core technologies in the MEANjs.org stack:
* [MongoDB](http://mongodb.org/)
* [Express](http://expressjs.com/)
* [AngularJS](http://angularjs.org/)
* [Node.js](http://nodejs.org/)

The MEANjs.org template is excellent for code organization and provides a excellent boilerplate for developing web applications. The application was developed using Node.js v4.2.6 and Mongo v3.0.7. The server side dependencies can be found in package.json and the client side in bower.json.

To install and run the project locally, make sure you have at least the above mentioned versions of Node.js and MongoDB installed. I recommend installing Node.js with NVM, package manager for managing version of Node.js.

Once your basic stack is up, clone this repository and go in to the directory where it was cloned. Open a bash terminal and type:
```bash
$ npm install
```
This will install all project dependencies. Before the application can, you will need an instance of MongoDB running as well. Open another bash terminal and type:
```bash
$ mongod
```
Now that all the dependencies are installed, you can run the application by typing the following in the original bash terminal you installed the project dependencies:
```bash
$ npm start
```
Once the app is done with the build process and starts up, you can view it in a browser by going to
```
http://0.0.0.0:3000/
```
