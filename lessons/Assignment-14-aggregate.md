This assignment consists of **two** parts. **Click the title of each part to expand the detailed instructons.** As the previous lesson was a long one, this lesson is short. It will help you understand how front end applications access a Rails API.

**_FIRST_**, Create a branch called `lesson14`, **when the lesson13 branch is active**.  The new branch will store your work.


<details>
  <summary>
    <h2>Calling REST from JavaScript</h2>
  </summary>

Now we will call the API using Fetch, from a front end application. We will create this front end application using ordinary JavaScript and HTML. Usually, a front end is created using a framework such as React. This lesson explains how it works, without requiring that you know React. However, this lesson does require knowledge of JavaScript, in particular to access and manipulate the DOM and to access APIs using fetch(). The fetch() API is asynchronous. In the provided code, the return is handled with .then and errors are handled with .catch. Optionally, you could mark event handling functions with async and use the await statement in a try/catch block, if you are more familiar with that style.

## The Starter Application

You already have the starter application, but it is not functionally complete. It is comprised of the two HTML files and the two JavaScript files in the public directory of the Rails REST application. Often, a front end is not served up by the same server as the back end API. If the front end resides on a different server, fetch calls to the API must have the full URL, instead of just the /. Also, the back end with the API must be configured with an additional gem, the rack-cors gem, to allow access from the front end on a different server, and the CORS configuration must be made appropriately restrictive for security reasons. Also, in this case, the fetch calls must set the credentials option to “include”. For simplicity, this lesson keeps everything on the same server. 

Start the server as usual. Now open the browser to localhost:3000\. You will see a very basic page, which is not styled at all. The default (session) page allows user enrollment, user logon, and user logoff. The members and facts page allows CRUD operations for members and facts. Try the various operations. Of course, you can’t change member and fact entries without being logged on, so you need to use that function first.

## Assignment

Create a git branch called fetch. This is where you will put the code changes for your lesson.

The HTML for this application is in public/index.html and public/session.html. The first of these pages calls public/member\_ops.js. The second page calls public/session\_ops.js. Because we wanted to keep this lesson short, nearly all of the function has been implemented. However, you will observe that nothing happens when you try to delete a member, or to create a fact, or to update a fact. Your task is to edit public/session\_ops.js to correct this. See the sections marked “your code goes here”. You can study the other sections to make it clear how the required fetch operations are to be done.

This reference may be helpful: <https://developer.mozilla.org/en-US/docs/Web/API/Fetch%5FAPI/Using%5FFetch>

## Submitting Your Work

When all is working, push your lesson14 branch to github and create a pull request.  You may elect to go on to the bonus lesson on CORS.  That work will be in a new branch.  If you do the bonus assignment, include links for both pull requests in your homework submission.  Even if you don't do the second assignment, please read through it to familiarize yourself with the concepts.


</details>

<details>
  <summary>
    <h2>Support for CORS</h2>
  </summary>

In the fetch assignment, you created a simple front end to call your API.  That front end loads from http://localhost:3000, which is the same origin that runs the back end API.  In general, the front end and back end of applications don't run from the same origin.  The front end is often built using React, and runs on a separate server.  In this lesson, you will learn how to make cross origin requests.  It's not hard, but there are a couple of tricky issues.

You must enable a protocol called Cross Origin Resource Sharing, or CORS.  When requests come in from a different origin, the application has to have security protections.  With CORS, most requests require pre-flight authorization.  That is, before the browser actually sends the request, it sends a pre-flight request to the server to see if the request is to be authorized.  On the browser side, this all happens under the covers.  But on the server side, you need specific machinery to handle this checking.  Rails provides a gem for this, the rack-cors gem.  You configure that gem as part of this lesson.

However, just enabling CORS won't suffice to make this application work.  We are using cookie based security, and we have to make that work over CORS.  The next two sections are very geek, so skip them if you like.  

## A Deep Dive on Cookies

There are two cookies involved, the session cookie and the csrf token.  When the server sets a cookie, several flags are included.  The session cookie is set with the httponly flag set to true, because that one is supposed to be inaccessible to JavaScript on the browser.  The CSRF token does not have that flag set, because the JavaScript needs to access the token and pass it back with requests, so that it can be validated on the server side to prevent cross site request forgery.

The other flags involved are the same-site flag, the secure flag, and the partitioned flag.  (Yeah, apologies, this is a little complicated.)  The same-site flag must be set to None.  Otherwise the cookie will not be sent back by the browser in a cross origin fetch request.  So, we need to set same-site to None.  Browsers will not honor this setting unless we also have to set the secure flag, which means that the cookie is only sent over HTTPS (encrypted) requests. Now, a cookie that is sent cross site is a third party cookie.  Unfortunately, third party cookies have been abused for tracking purposes, and so the browsers are ending support for them ... except (are you still with me?) for cookies with the partitioned flag.  Partitioned cookies can't be abused in the same way.  So, our cookies have to have same-site=None, secure=true, and partitioned.

When we do this, the application does not work. (We'll make it work -- stand by.) We have set secure=true.  But in development, you aren't running HTTPS.  You only have HTTP, as you don't have SSL configured. We need to configure Rails to send the cookie anyway.  Also, Rails does not support setting the partitioned flag, because the decision by browser vendors to introduce it is recent.  Rails has fixes in the works for both problems, but they are not available yet.  So, what to do?

## Monkeypatching!

Monkeypatching is changing the runtime behavior of system code, in this case code within Rails.  Are there downsides to monkeypatching? You betcha!  It can be difficult to figure out the patch, because Rails code is complicated.  Also, it is possible that the patch can cause the application to fail in hard to predict ways. Finally, the patch probably won't work except for a particular Rails version.  These are all serious problems, but in this case, there is no alternative.  Here are the patches I created, and they are well tested.

## Changes for Cookie Handling

Add the following code to config/application.rb.  These are the monkeypatches. They go right after the Bundler.require line.
```ruby
module SetCookiePartitionFlag
  def set_cookie(key, value)
    cookie_header = get_header 'set-cookie'
    set_header 'set-cookie', add_cookie_to_header(cookie_header, key, value)
  end
  def add_cookie_to_header(header, key, value)
    case value
    when Hash
      domain  = "; domain=#{value[:domain]}"   if value[:domain]
      path    = "; path=#{value[:path]}"       if value[:path]
      max_age = "; max-age=#{value[:max_age]}" if value[:max_age]
      expires = "; expires=#{value[:expires].httpdate}" if value[:expires]
      secure = "; secure"  if value[:secure]
      partitioned = "; partitioned"  if value[:partitioned]
      httponly = "; HttpOnly" if (value.key?(:httponly) ? value[:httponly] : value[:http_only])
      same_site =
        case value[:same_site]
        when false, nil
          nil
        when :none, 'None', :None
          '; SameSite=None'
        when :lax, 'Lax', :Lax
          '; SameSite=Lax'
        when true, :strict, 'Strict', :Strict
          '; SameSite=Strict'
        else
          raise ArgumentError, "Invalid SameSite value: #{value[:same_site].inspect}"
        end
      value = value[:value]
    end
    value = [value] unless Array === value

    cookie = "#{escape(key)}=#{value.map { |v| escape v }.join('&')}#{domain}" \
      "#{path}#{max_age}#{expires}#{secure}#{partitioned}#{httponly}#{same_site}"

    case header
    when nil, ''
      cookie
    when String
      [header, cookie].join("\n")
    when Array
      (header + [cookie]).join("\n")
    else
      raise ArgumentError, "Unrecognized cookie header value. Expected String, Array, or nil, got #{header.inspect}"
    end
  end
  def escape(s)
    URI.encode_www_form_component(s)
  end
end
module Rack::Response::Helpers
  prepend SetCookiePartitionFlag
end

module SendSessionForLocalHost # We need to be able to send a secure cookie in non-SSL cases
  # In particular, for localhost, or as typically deployed in production, where a proxy
  # handles the SSL.  This "monkeypatch" is not safe for cases where the server is neither
  # behind such a proxy or on localhost.
  private
  def security_matches?(request,options)
    @assume_ssl ||= @default_options.delete(:assume_ssl)
    return true unless options[:secure]
    request.ssl? || @assume_ssl == true  
  end 
end

class Rack::Session::Abstract::Persisted
  prepend SendSessionForLocalHost
end
```
Right after config.load_defaults, add this line:
```ruby
    config.action_controller.forgery_protection_origin_check = false
```
Then, right after the ActionDispatch::Cookies line, add:
```ruby
    ActionDispatch::Cookies::CookieJar.always_write_cookie = true 
    # this will send secure cookies without SSL
```
Finally, the line for ActionDispatch::Session::CookieStore should read as follows:
```ruby
    config.middleware.use ActionDispatch::Session::CookieStore, same_site: :None, 
      secure: true, partitioned: true, assume_ssl: true
```
Also, the app/controllers/users/session_controller.rb, and the app/controllers/users/registrations_controller.rb, must be changed so that the cookie with the CSRF token has the right flags, as follows:
```ruby
  cookies["CSRF-TOKEN"] = { value: form_authenticity_token, secure: true, same_site: :None, partitioned: true }
```
## CORS Configuration

Add this line to the Gemfile, in the main section (not in the stanzas for development or test):
```ruby
gem "rack-cors"
```
Then do a `bin/bundle install`.  This is the CORS gem.  You also have to create a configuration for it.  Change the file `config/initializers/cors.rb` to read:
```ruby
# Be sure to restart your server when you modify this file.

# Avoid CORS issues when API is called from the frontend app.
# Handle Cross-Origin Resource Sharing (CORS) in order to accept cross-origin AJAX requests.

# Read more: https://github.com/cyu/rack-cors

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins "http://localhost:3001"

    resource "*",
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head],
      credentials: true
  end
end
```
This configuration will allow CORS requests, but only from the origin http://localhost:3001.  You want to restrict access for security reasons, so you put in the origins corresponding to the front end.

## Testing for CORS

You are going to run two instances of the Rails application.  The back end will run on port 3000, and the front end will run on port 3001, as follows:
```bash
bin/rails s -p 3000 -P 3000
bin/rails s -p 3001 -P 3001
```
Then, try out the front end, by pointing your browser to http://localhost:3001.  You should be able do do all that you could do before on port 3000.  The point of the exercise (as we did not add any function) is to understand CORS configuration, which you'll typically need in production deployments.

## Submitting Your Work

You can now add, commit, and push changes for the lesson14 branch.  They will be added to your PR, if you opened one after completing the first part of the lesson.

</details>
