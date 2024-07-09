
The git repository with the starter Rails application for this lesson is [here.](https://github.com/Code-the-Dream-School/R7-rest) This is a long and somewhat difficult assignment. Fork and clone this repository as usual.  Then create a lesson12 branch, where you will do your work.

The command we used to create this workspace was:

```bash
rails new rest-rails --api -T
```
You do NOT need to do the command to create the application, as you are instead using the starter repository above.  Note the –api parameter. This Rails application loads a subset of Rails. You can’t render views with it, but you can send and receive JSON documents, as we will see.

## Initial Setup

You will need some additional gems. Add the following to your Gemfile. These settings should be added so that it is associated with development, test, and production. We can use the bundle add command as follows

```bash
bin/bundle add devise
bin/bundle add email_validator
bin/bundle add strong_password
```

Devise is a gem that enables authentication, and is widely used for that purpose in Rails applications. Devise, as we are using it, requires configuration of the Rails session. This is usually on by default, but in API only configurations, Rails turns it off, so we have to turn it back on. Add the following two lines to the config/application.rb, just before the two end statements at the bottom of this file:  

```ruby
config.middleware.use ActionDispatch::Cookies
config.middleware.use ActionDispatch::Session::CookieStore
```

This stores the Rails session information in a cookie, a little piece of additional information that this then transmitted with each request from the browser. The cookie is HTTP only, so browser side JavaScript can’t get to it, and it is also encrypted.   

Next we set up Devise. Enter the following commands:

```bash
bin/rails g devise:install
bin/rails g devise User
bin/rails db:migrate
```

Update the app/models/user.rb file as follows:

```ruby
class User < ApplicationRecord
  validates :email, presence: true, uniqueness: true, email: true
  validates :password, password_strength: true

  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable
end
```

Then run the migration.

```
bin/rails db:migrate
```

This completes the initial setup.

## Creating Controllers

We need three controllers, one for user registration, one for session management, and one for testing logon. So, enter the following commands:

```bash
bin/rails g controller users/Registrations
bin/rails g controller users/Sessions
bin/rails g controller test
```

Edit app/controllers/users/registrations\_controller.rb, to match the following:

```ruby
class Users::RegistrationsController < Devise::RegistrationsController
  respond_to :json

  private

  def respond_with(resource, _opts = {})
    register_success && return if resource.persisted?

    register_failed resource
  end

  def register_success
    render json: { message: 'Signed up sucessfully.' }, status: :created
  end

  def register_failed resource
    render json: { message: resource.errors.full_messages }, status: :bad_request
  end
end
```

It is not really obvious what this controller does, but it overrides the Devise controller to handle JSON responses. The same is true of app/controllers/users/sessions\_controller.rb, which should be changed to match this:

```ruby
class Users::SessionsController < Devise::SessionsController
  respond_to :json

  def destroy 
    @logged_in_user = current_user
    super 
  end

  private

  def respond_with(resource, _opts = {})
    if !resource.id.nil?
      render json: { message: 'You are logged in.' }, status: :created
    else
      render json: { message: 'Authentication failed.'}, status: :unauthorized
    end
  end

  def respond_to_on_destroy
    log_out_success && return if @logged_in_user

    log_out_failure
  end

  def log_out_success
    render json: { message: "You are logged out." }, status: :ok
  end

  def log_out_failure
    render json: { message: "Hmm nothing happened."}, status: :unauthorized
  end
end
```

In general, REST operations other than registration and logon require authentication. So we need a method to verify that a user has been authenticated. We create that method in a new file you should create, app/controllers/concerns/authentication\_check.rb, as follows:

```ruby
module AuthenticationCheck
  extend ActiveSupport::Concern
  
  def is_user_logged_in
    if current_user.nil?
      render json: { message: "No user is authenticated." },
        status: :unauthorized
    end
  end
end
```

This is the standard way of creating a method that will be accessible to a variety of controllers. Now, edit app/controllers/test\_controller.rb to match the following. You will see that it calls the method is\_user\_logged\_in.

```ruby
class TestController < ApplicationController
  include AuthenticationCheck

  before_action :is_user_logged_in

  def show
    render json: { message: "If you see this, you're logged in!" },
      status: :ok
  end
end
```

This is just a test controller to verify that login works.

## Adding Routes

Now we need to configure routes for the controllers that have been created. config/routes.rb should be edited to match the following:

```ruby
Rails.application.routes.draw do
  devise_for :users,
             controllers: {
                 sessions: 'users/sessions',
                 registrations: 'users/registrations'
             }
  get '/test', to: 'test#show'
end
```

Also, add the following line to config/initializers/devise.rb, just before the last end statement:

```ruby
config.navigational_formats = []
```

This is to tell Devise that it is running in an API only Rails configuration, so that it does not attempt to call functions that only work when there are views.

## Testing the REST Server with Postman

We are now ready to start the REST server. Typically the server would be called by a separate front end process, written in a framework such as React. We will create such a front end, just using Rails, HTTP, and JavaScript, in a future lesson. However, we can test without the front end using Postman.

Start the server as usual. Also, start Postman. On the Postman screen, in the upper left, there is a New button, click on that, and choose collection. Create a collection called rest-test. Once the collection is created, you can add requests to the collection. You move the mouse cursor over the collection and click on the three dots and then on Add request.

Create a request called test. This is a GET request, and the URL is http://localhost:3000/test . Once you have created the request in Postman, click on the Send button. You will see JSON returned in the body of the response that says, “No user is authenticated.” We haven’t registered or signed in, so the test API fails with a 401 return code.

Next create a request called register. This is a POST request. The URL is http://localhost:3000/users . You need to put JSON in the body of the request. Click on body, select raw, and then in the pulldown to the right select JSON. Then paste in the following JSON:

```json
{
    "user": {
        "email": "test@example.com",
        "password": "12345678"
    }
}
```

You will see a message that the password is too weak. So, change the password in the JSON to be a7&43Wcxy6ij , and try the request again. You will now see that the user has been signed up successfully. When a user signs up, Devise automatically logs that user in. So, try the test request again. You will see the reponse that you are logged in. If you click on the cookies tab in the bottom window, you can see the cookies being used to authenticate the user.

Create another request called logon. This is a POST request for the URL http://localhost:3000/users/sign in. The JSON in the body of the request is:

```json
{
    "user": {
        "email": "test@example.com",
        "password": "a7&43Wcxy6ij"
    }
}
```

Create another request called logoff. This is a DELETE request, and the URL is http://localhost:3000/users/sign\_out . There is no body to the request.

Then verify that you can use these Postman operations to logon and logoff, and that the test request returns an appropriate message in each case. You may also try logging on with bad credentials.

## Saving Your Work

Now would be a good time to add, commit, and push your lesson12 branch.  That will preserve the current working code while you start the next section.  You complete the next section before submitting your work.
