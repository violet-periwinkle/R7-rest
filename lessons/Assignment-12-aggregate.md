This lesson consists of **two parts**.  **Click the title of each part to expand the detailed instructons.** The git repository with the starter Rails application for this lesson is [here.](https://github.com/Code-the-Dream-School/R7-rest)  _This is a long and somewhat difficult assignment, so plan your time well._ Fork and clone this repository as usual.  Then create a lesson12 branch, where you will do your work.

<details>
<summary>
  <h2>REST Introduction and Authentication</h2>
</summary>

The command we used to create this workspace was:

```
rails new rest-rails --api -T
```
You do NOT need to do the command to create the application, as you are instead using the starter repository above.  Note the –api parameter. This Rails application loads a subset of Rails. You can’t render views with it, but you can send and receive JSON documents, as we will see.

## Initial Setup

You will need some additional gems. Add the following to your Gemfile. These settings should be added so that it is associated with development, test, and production. We can use the bundle add command as follows

```
bin/bundle add devise
bin/bundle add email_validator
bin/bundle add strong_password
```

Devise is a gem that enables authentication, and is widely used for that purpose in Rails applications. Devise, as we are using it, requires configuration of the Rails session. This is usually on by default, but in API only configurations, Rails turns it off, so we have to turn it back on. Add the following two lines to the config/application.rb, just before the two end statements at the bottom of this file:  

```
config.middleware.use ActionDispatch::Cookies
config.middleware.use ActionDispatch::Session::CookieStore
```

This stores the Rails session information in a cookie, a little piece of additional information that this then transmitted with each request from the browser. The cookie is HTTP only, so browser side JavaScript can’t get to it, and it is also encrypted.   

Next we set up Devise. Enter the following commands:

```
bin/rails g devise:install
bin/rails g devise User
bin/rails db:migrate
```

Update the app/models/user.rb file as follows:

```
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

```
bin/rails g controller users/Registrations
bin/rails g controller users/Sessions
bin/rails g controller test
```

Edit app/controllers/users/registrations\_controller.rb, to match the following:

```
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

```
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

```
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

```
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

```
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

```
config.navigational_formats = []
```

This is to tell Devise that it is running in an API only Rails configuration, so that it does not attempt to call functions that only work when there are views.

## Testing the REST Server with Postman

We are now ready to start the REST server. Typically the server would be called by a separate front end process, written in a framework such as React. We will create such a front end, just using Rails, HTTP, and JavaScript, in a future lesson. However, we can test without the front end using Postman.

Start the server as usual. Also, start Postman. On the Postman screen, in the upper left, there is a New button, click on that, and choose collection. Create a collection called rest-test. Once the collection is created, you can add requests to the collection. You move the mouse cursor over the collection and click on the three dots and then on Add request.

Create a request called test. This is a GET request, and the URL is http://localhost:3000/test . Once you have created the request in Postman, click on the Send button. You will see JSON returned in the body of the response that says, “No user is authenticated.” We haven’t registered or signed in, so the test API fails with a 401 return code.

Next create a request called register. This is a POST request. The URL is http://localhost:3000/users . You need to put JSON in the body of the request. Click on body, select raw, and then in the pulldown to the right select JSON. Then paste in the following JSON:

```
{
    "user": {
        "email": "test@example.com",
        "password": "12345678"
    }
}
```

You will see a message that the password is too weak. So, change the password in the JSON to be a7&43Wcxy6ij , and try the request again. You will now see that the user has been signed up successfully. When a user signs up, Devise automatically logs that user in. So, try the test request again. You will see the reponse that you are logged in. If you click on the cookies tab in the bottom window, you can see the cookies being used to authenticate the user.

Create another request called logon. This is a POST request for the URL http://localhost:3000/users/sign in. The JSON in the body of the request is:

```
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
  
</details>

<details>
<summary>
  <h2>More REST APIs</h2>
</summary>

In this part of the assignment, you continue to work on the lesson12 branch.  Of course, in a real production application, you do more than just authentication.  Accordingly, in this part of the lesson, you add support for REST requests that do CRUD operations.

## Models

First, create your models. WIthin the repository directory, you do the following commands:

```
bin/rails generate model Member first_name:string last_name:string user:references
bin/rails generate model Fact member:references fact_text:string likes:integer
```

We want to implement authorization as well as authentication. Each user will have their own set of member and fact records. Accordingly, there is a one-to-many relationship between users and members. We will implement authorization checks so that a user can only see their own records. There is also a one-to-many relationship between members and facts.

Next you edit the model files. The file app/models/member.rb should look like this:

```
class Member < ApplicationRecord
  belongs_to :user
  validates :first_name, presence: true
  validates :last_name, presence: true
  validates :user_id, presence: true
  has_many :facts
end
```

And app/models/fact.rb should look like this:

```
class Fact < ApplicationRecord
  validates :fact_text, presence: true
  validates :likes, presence: true
  validates :member_id, presence: true
  validates_associated :member
  belongs_to :member
end
```

Note that you have validations, just as in Rails UI applications with views. Next, you set up the development and test databases as follows:

```
bin/rails db:migrate
bin/rails db:migrate RAILS_ENV=test
```

## Controllers

Now, you set up your controllers. We are going to set them up with a route namespace, that includes a version number for the API. This is best practice, as your API may change over time.

```
bin/rails g controller api/v1/Members
bin/rails g controller api/v1/Facts
```

Next you set up your routes. You should add the following section to your config/routes.rb file:

```
  namespace :api do
    namespace :v1 do
      resources :members do
        resources :facts
      end
    end
  end
```

These routes are similar to what you have used before, with the exception that you are using route namespaces to separate them out. The routes for facts are nested within the member routes, corresponding to the one-to-many association between members and facts.

## Adding Application Logic

Your application logic goes in your controllers. Because this is an API, there are no files corresponding to views. When a request comes in, the response will always render JSON, to send the responses in JSON format back to the caller. In other respects, the processing is much as in Rails UI applications. The HTTP status code returned will be, by default, 200, but there are other status codes that are appropriate sometimes. For example, 201 means resource created, and the 400 series codes imply a client side error. We will require authentication for access to these controller operations, so we need to include AuthenticationCheck and call is\_user\_logged\_in. This is an unfinished version of your app/controllers/api/v1/members\_controller.rb file:

```
class Api::V1::MembersController < ApplicationController
  include AuthenticationCheck

  before_action :is_user_logged_in
  before_action :set_member, only: [:show, :update, :destroy]

  # GET /members
  def index
    @members = Member.where(user_id: current_user.id)
    render json: {members: @members}
  end

  # GET /members/:id
  def show
    if check_access
      # your code goes here
    end
  end

  # POST /members
  def create
    @member = Member.new(member_params)
    @member.user_id = current_user.id
    if @member.save
      render json: @member, status: 201
    else
      render json: { error:
        "Unable to create member: #{@member.errors.full_messages.to_sentence}"},
        status: 400
    end
  end

  # PUT /members/:id
  def update
    if check_access
      # your code goes here
    end
  end

  # DELETE /members/:id
  def destroy
    if check_access
      @member.destroy
      render json: { message: 'Member record successfully deleted.'}, status: 200
    end
  end

  private

  def member_params
    params.require(:member).permit(:first_name, :last_name)
  end

  def set_member
    @member = Member.find(params[:id])
  end

  def check_access
    if (@member.user_id != current_user.id) 
      render json: { message: "The current user is not authorized for that data."}, status: :unauthorized
      return false
    end
    true
  end
end
```

You will have to complete the update and show methods yourself.. Include error handling! For the app/controllers/api/v1/facts\_controller.rb file, you can use the following outline, but most of the methods you will have to complete yourself.

```
class Api::V1::FactsController < ApplicationController
  include AuthenticationCheck

  before_action :is_user_logged_in
  before_action :set_fact, only: [:show, :update, :destroy]
  before_action :check_access

  # GET /members/:member_id/facts
  def index
    @member = Member.find(params[:member_id])
    render json: @member.facts # note that because the facts route is nested inside members
                             # we return only the facts belonging to that member
  end

  # GET /members/:member_id/facts/:id
  def show
    # your code goes here
  end

  # POST /members/:member_id/facts
  def create
     @member = Member.find(params[:member_id])
    @fact = @member.facts.new(fact_params)
    if @fact.save
      render json: @fact, status: 201
    else
      render json: { error: 
"The fact entry could not be created. #{@fact.errors.full_messages.to_sentence}"},
      status: 400
    end
  end

  # PUT /members/:member_id/facts/:id
  def update
    # your code goes here
  end

  # DELETE /members/:member_id/facts/:id
  def destroy
    # your code goes here
  end

  private

  def fact_params
    params.require(:fact).permit(:fact_text, :likes)
  end

  def set_fact
    @fact = Fact.find_by(id: params[:id], member_id: params[:member_id])
  end
  
  def check_access 
    @member = Member.find(params[:member_id])
    if @member.user_id != current_user.id
      render json: { message: "The current user is not authorized for that data."}, status: :unauthorized
    end
  end
end
```

## Exception Handling

The client application may send some bad JSON, or specify the id of a user or fact that does not exist. You need to catch those errors and return an appropriate error message and HTTP result code to the calling client application. This is done by creating an exception handler module, which is app/controllers/concerns/exception\_handler.rb:

```
# app/controllers/concerns/exception_handler.rb
module ExceptionHandler
  # provides the more graceful `included` method
  extend ActiveSupport::Concern

  included do
    rescue_from ActiveRecord::RecordNotFound do |e|
      render json: { error: e.message }, status: :not_found
    end

    rescue_from ActiveRecord::RecordInvalid do |e|
      render json: { error: e.message }, status: :unprocessable_entity
    end

    rescue_from ActionController::ParameterMissing do |e|
      render json: { error: e.message }, status: :unprocessable_entity
    end
  end
end

```

Then add this line to app/controllers/application\_controller.rb, just before the end statement:

```
  include ExceptionHandler
```

## Testing Your Code Using Postman

Postman will send JSON to the URL you specify, and will also report back the JSON it receives. You can send the following commands, to see what happens. First, start the server using 

```
bin/rails s 
```

Then create Postman requests for each of the operations on members and facts. These would include a GET for all members, a GET for a particular member, a POST to create a member, a PUT to update a member, and a DELETE for a member. You will have to use the ID of the member in the URL for operations on a particular member. Then do the same for all CRUD operations on facts. For example, suppose you have a member with ID 2\. Then you could retrieve all the facts for that member from the following URL:

```
http://localhost:3000/api/v1/members/2/facts
```

Once you have created all these requests, try them out. Of course, you must be logged in to perform these operations.

## More on Security

We are using HttpOnly cookies as the store for the authentication token. This approach reduces the risks associated with cross site scripting attacks. However, it introduces a new security vulnerability, called cross site request forgery (CSRF). CSRF attacks work as follows. The user logs in to our application, and then while still logged in, they access another application that includes a hostile script. That script posts a request to our application, and because the cookies reside in the browser, the user’s logon credentials accompany the post from the hostile script. In this way, the hostile script can change user data in our application.

To prevent this attack, we need another security token. This is stored in a cookie too, but one that is accessible from JavaScript. It is inaccessible to hostile scripts that reside outside the application, however. We then set the X-CSRF-Token security header, and enable forgery protection in Rails.

Add the following line to app/controllers/users/registrations\_controller.rb, right after the responds\_to line:

```
  skip_forgery_protection only: [:create]
```

The same line must be added to app/controllers/users/sessions\_controller.rb, at the same place. Then, add these lines to each of these files:

```
      cookies["CSRF-TOKEN"] = form_authenticity_token
      response.set_header('X-CSRF-Token', form_authenticity_token)
```

They go right above the “signed up successfully” in the registrations controller, and the “you are logged in” in the sessions controller. It is not really necessary to set the header to make this work, but it is convenient when we add swagger enablement in the next session.

At the top of the app/controllers/application\_controller.rb file, you will see this line:

```
class ApplicationController < ActionController::API
```

One side effect is that forgery protection is disabled in Rails. So the line should be changed to read:

```
class ApplicationController < ActionController::Base
```

Once these changes are in place, you can restart the server and retest using Postman. You will now find that some requests don’t work, in particular any POST, PUT, or DELETE requests, except for the two that handle registration and logon.

To get these other requests working again, you need a way to capture the CSRF token. First, in Postman, click on the New at the top of the window and select Environment. Give your new environment some name. This is where the token will be stored. When you finish, the name of the environment you created should be in the upper right of the window. Then edit the registration request, and click on the tests tab. Add the following line:

```
pm.environment.set("CSRF",pm.cookies.get('CSRF-TOKEN'))
```

Make the same change to the logon request. The “test”, which is really request post processing, captures the token from the cookie when logon or registration occurs and stores it in the Postman environment. Then, for each of your Postman POST, PUT, and DELETE requests (except registration and logon) you need to change the headers to add:

```
X-CSRF-Token {{CSRF}}
```

This sets the required header from the environment variable. Do the logon request, and then try the other POST, PUT, and DELETE requests. They should now work.

## Submitting Your Work

Once you get this far, stop the server, commit your changes, push them to github, and open a pull request. It’s time to submit your homework for this week.
  
</details>
