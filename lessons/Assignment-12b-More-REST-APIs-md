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