Now we will call the API using Fetch, from a front end application. We will create this front end application using ordinary JavaScript and HTML. Usually, a front end is created using a framework such as React. This lesson explains how it works, without requiring that you know React. However, this lesson does require knowledge of JavaScript, in particular to access and manipulate the DOM and to access APIs using fetch(). The fetch() API is asynchronous. In the provided code, the return is handled with .then and errors are handled with .catch. Optionally, you could mark event handling functions with async and use the await statement in a try/catch block, if you are more familiar with that style.

As the previous lesson was a long one, this lesson is short. It will help you understand how front end applications access a Rails API.

Create a branch called lesson14, when the lesson13 branch is active.  The new branch will store your work.

## The Starter Application

You already have the starter application, but it is not functionally complete. It is comprised of the two HTML files and the two JavaScript files in the public directory of the Rails REST application. Often, a front end is not served up by the same server as the back end API. If the front end resides on a different server, fetch calls to the API must have the full URL, instead of just the /. Also, the back end with the API must be configured with an additional gem, the rack-cors gem, to allow access from the front end on a different server, and the CORS configuration must be made appropriately restrictive for security reasons. Also, in this case, the fetch calls must set the credentials option to “include”. For simplicity, this lesson keeps everything on the same server. 

Start the server as usual. Now open the browser to localhost:3000\. You will see a very basic page, which is not styled at all. The default (session) page allows user enrollment, user logon, and user logoff. The members and facts page allows CRUD operations for members and facts. Try the various operations. Of course, you can’t change member and fact entries without being logged on, so you need to use that function first.

## Assignment

Create a git branch called fetch. This is where you will put the code changes for your lesson.

The HTML for this application is in public/index.html and public/session.html. The first of these pages calls public/member\_ops.js. The second page calls public/session\_ops.js. Because we wanted to keep this lesson short, nearly all of the function has been implemented. However, you will observe that nothing happens when you try to delete a member, or to create a fact, or to update a fact. Your task is to edit public/session\_ops.js to correct this. See the sections marked “your code goes here”. You can study the other sections to make it clear how the required fetch operations are to be done.

This reference may be helpful: <https://developer.mozilla.org/en-US/docs/Web/API/Fetch%5FAPI/Using%5FFetch>

## Submitting Your Work

When all is working, push your lesson14 branch to github and create a pull request.  You may elect to go on to the bonus lesson on CORS.  That work will be in a new branch.  If you do the bonus assignment, include links for both pull requests in your homework submission.  Even if you don't do the second assignment, please read through it to familiarize yourself with the concepts.
