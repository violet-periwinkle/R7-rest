You are going to create an API that communicates using REST protocols, and that exchanges JSON data. It’s a good idea to understand what REST is:

<https://dzone.com/articles/introduction-to-rest-api-restful-web-services>

And also, you need to understand JSON:

https://youtu.be/GpOO5iKzOmY

REST, which stands for REpresentational State Transfer, is a very widely used means of implementing APIs on the Internet.  The caller, which might be JavaScript in a browser, and which might be a server or other process, calls the REST API using HTTP.  Although ordinary browser applications without JavaScript can only do GET and POST calls, REST calls can include GET, POST, PUT, PATCH, and DELETE. For POST, PATCH, and PUT, the caller sends data in the body of the request, which is typically in JSON format.  The server providing the API then returns a response, which typically is also in JSON.

The APIs you implement include user registration and authentication.  You also implement CRUD operations for two models, Member and Fact, with a one-to-many association between members and facts.  You also implement access control, so that only the user who creates a member or fact can access that data.  Of course, all operations will have error handling, in case invalid requests are sent by the caller.

Because this is an API, you can't test it from a browser.  You need a way to send GET, POST, PUT, and so on to your application.  The test tool to be used is Postman, and your lessons explain its use.

Once the APIs are implemented, you document them.  The best way to document an API is to use a standard called Swagger.  You can read about it [here.](https://swagger.io/docs/specification/2-0/what-is-swagger/) Swagger documentation can be built automatically from your Rspec test cases.

In a later lesson, you will call the APIs from JavaScript in a browser.  The browser application will also be served up by Rails, but it will not use embedded Ruby.  It will be plain JavaScript and HTML.

## Some Security Points

In an earlier version of this lesson, authentication used a JSON Web Token (JWT), which was transmitted to the front end to be stored in browser local storage. This is a common approach — but it is bad for security. If the application has a very common security vulnerability called cross site scripting (XSS), the attacker can capture the token and do anything the user is authorized to do. When communicating with a browser running in a front end, we should always store the credential in an HttpOnly cookie, which is inaccessible to client side JavaScript and is therefore more secure. That’s how the user authentication token is stored in this lesson. JWTs can be used when one server is authenticating to another, because in that case, the first server has a secure place to store the JWT. As we’ll see, there are several other security points we must address.  The cookie based approach we use would not suit the case where one server calls another, because cookies are handled by browsers.
