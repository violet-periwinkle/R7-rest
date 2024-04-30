When you create a REST API, you also need (a) an automated way to test the API, something easier than Postman, and (b) a way to document the API, so that implementers of front end applications that call the API can know how to call it. RSpec may be used to test APIs as well as to test Rails UI applications. The standard and best way to document the API is to create a special user interface for it called Swagger. 

We will create a partial set of RSpec tests. These tests will be of a particular format, so that they can be used to generate the Swagger UI.

Create a new branch, lesson13.  This branch should be created when the lesson12 branch is active.

## Setting Up for Rspec and Swagger

Add the following lines to your Gemfile:

First, in the section before the group :development, :test line, add these lines to get the swagger gem:

```
gem 'rspec-rails'
gem 'rexml'
gem 'rswag'
```

The rswag line is to add the swagger gem. Then, add a group :test section to your Gemfile, near the bottom, which should look like:

```
group :test do
  gem 'factory_bot_rails'
  gem 'faker'
  gem 'rails-controller-testing'
end
```

When all of these changes have been made, do a bundle install to load the new gems. Then, complete the installation of the rswag and rspec-rails gems with these commands:

```
bin/rails generate rspec:install
bin/rails generate rswag:install
```

## Factories and RSpec Tests

You will need FactoryBot factories for test user, member, and fact entries. Create spec/factories/users.rb as follows:

```
require 'faker'

FactoryBot.define do
  factory :user do |f|
    f.email { Faker::Internet.email }
    f.password { Faker::Internet.password(min_length: 15, max_length: 20, mix_case: true, special_characters: true) }
  end
end
```

Create also spec/factories/members.rb as follows:

```
require 'faker'

FactoryBot.define do
  factory :member do 
    first_name { Faker::Name.name }
    last_name { Faker::Lorem.word }
    user
  end
end
```

Here we are managing the one-to-many relationship between users and members, by creating the user entry first, and then passing that as a parameter to the create of the member entry. Create also spec/factories/facts.rb as follows:

```
require 'faker'

FactoryBot.define do
  factory :fact do
    fact_text { Faker::ChuckNorris.fact }
    likes { Faker::Number.number(digits: 3).to_i }
    association :member
  end
end
```## Creating the Rspec Tests

We need to create tests for each of the controllers. Our tests must authenticate a user. For this, we need the Devise test helpers. So add this line to the bottom of spec/rails\_helper.rb, just before the final end:

```
  config.include Devise::Test::IntegrationHelpers, type: :request
```

Create spec/requests/registrations\_spec.rb, as follows:

```
require 'swagger_helper'

RSpec.describe 'user/registrations', type: :request do
  path '/users' do
    post 'create user' do
      tags 'Registrations'
      consumes 'application/json'
      produces 'application/json'
      parameter name: :user, in: :body, required: true, schema: {
        type: :object,
        required: %i[email password],
        properties: { user: { properties: {
          email: { type: :string },
          password: { type: :string }
        }}}
      }
      response(201, 'successful') do
        let(:user1) { FactoryBot.attributes_for(:user) }
        let(:user) do
          { user: {
              email: user1[:email],
              password: user1[:password]
          }}
        end
        after do |example|
          example.metadata[:response][:examples] = { 'application/json' => JSON.parse(response.body, symbolize_names: true) }
        end
        run_test!
      end
    end
  end
end
```

The swagger gem is here introducing some domain specific language into rspec. This is done so that the Swagger UI can be generated from the rspec tests. You have a series of path statements corresponding to your rails routes, and get/post/put/patch/delete statements also corresponding to the routes. We also specify the parameters and their types. We are just testing that a valid return code and json body comes back. Good rspec testing would add a number of expect statements to make sure the body is valid, and additional test cases would be provided for invalid data. So what we have is too limited to be a comprehensive test, but it suffices to generate swagger code. (By the way, the swagger gem has the capability to generate an outline for these test files.)

Create spec/requests/sessions\_spec.rb as follows:

```
require 'swagger_helper'

describe 'sessions API' do
  #Creates swagger for documentaion for login
  path '/users/sign_in' do

    post 'Creates a session' do
      let(:user1) { FactoryBot.create(:user) }
      tags 'sessions'
      consumes 'application/json'
      produces 'application/json'
      parameter name: :user, in: :body, required: true, schema: {
        type: :object,
        properties: { user: { properties: {
          email: { type: :string },
          password: { type: :string}
        }}},
        required: [ 'email', 'password' ]
      }

      response '201', 'session established' do
        let(:user) do
          { user: {
              email: user1.email,
              password: user1.password
          }}
        end
        run_test!
      end

      response '401', 'Unauthorized' do
        let(:user) do
          { user: {
              email: user1.email,
              password: ""
          } }
        end
        run_test!
      end
    end
  end


  path '/users/sign_out' do

    delete 'End user session' do
      before(:context) do
        # let(:user) { FactoryBot.create(:user) }
        sign_in FactoryBot.create(:user)
      end
      tags 'sessions'
      consumes 'application/json'
      produces 'application/json'

        response '200', 'session ended' do
          run_test!
        end
      # This one fails, as the user is no longer logged on
      response '401', 'no user logged on' do
        run_test!
      end
    end
  end
end
```

Next we create a test for the members controller, and for each of the methods within that controller. Every method within the members controller requires authentication. Create spec/requests/api/v1/members\_spec.rb as follows:

```
require 'swagger_helper'

RSpec.describe 'api/v1/members', type: :request do
  let!(:user) { FactoryBot.create(:user)}
  let!(:members) { FactoryBot.create_list(:member, 15, user: user)}
  let!(:member_id) { members.first.id }
  let!(:member) { FactoryBot.build(:member, user: user)}
  before(:each) do
    sign_in user
  end

  path '/api/v1/members' do

    get('list members') do
      tags 'Members'
      produces 'application/json'
      response(200, 'successful') do
        after do |example|
          example.metadata[:response][:examples] = { 'application/json' => JSON.parse(response.body, symbolize_names: true) }
        end
        run_test!
      end
    end

    post('create member') do
      tags 'Members'
      consumes 'application/json'
      produces 'application/json'
      parameter name: :member, in: :body, required: true, schema: {
        type: :object,
        required: %i[first_name last_name],
        properties: {
          first_name: { type: :string },
          last_name: { type: :string }
        }
      }

      response(201, 'successful') do
        
        after do |example|
          example.metadata[:response][:examples] = { 'application/json' => JSON.parse(response.body, symbolize_names: true) }
        end
        run_test!
      end
    end
  end

  path '/api/v1/members/{id}' do
    parameter name: 'id', in: :path, type: :string, description: 'id'

    get('show member') do
      tags 'Members'
      response(200, 'successful') do
        let(:id) { member_id }

        after do |example|
          example.metadata[:response][:examples] = { 'application/json' => JSON.parse(response.body, symbolize_names: true) }
        end
        run_test!
      end
    end

    patch('update member') do
      tags 'Members'
      consumes 'application/json'
      produces 'application/json'
      parameter name: :member, in: :body, schema: {
        type: :object,
        properties: {
          first_name: { type: :string },
          last_name: { type: :string }
        }
      }
      response(200, 'successful') do
        let(:id) { member_id }
        let(:member) {{first_name: 'fred'}}
        after do |example|
          example.metadata[:response][:examples] = { 'application/json' => JSON.parse(response.body, symbolize_names: true) }
        end
        run_test!
      end
    end

    put('update member') do
      tags 'Members'
      consumes 'application/json'
      produces 'application/json'
      parameter name: :member, in: :body, schema: {
        type: :object,
        properties: {
          first_name: { type: :string },
          last_name: { type: :string }
        }
      }
      response(200, 'successful') do
        let(:id) { member_id }
        let(:member) {{first_name: 'fred'}}

        after do |example|
          example.metadata[:response][:examples] = { 'application/json' => JSON.parse(response.body, symbolize_names: true) }
        end
        run_test!
      end
    end

    delete('delete member') do
      tags 'Members'
      response(200, 'successful') do
        let(:id) { member_id }

        after do |example|
          example.metadata[:response][:examples] = { 'application/json' => JSON.parse(response.body, symbolize_names: true) }
        end
        run_test!
      end
    end
  end
end
```

Finally, we create the test file for facts, as spec/requests/api/v1/facts\_spec.rb:

```
require 'swagger_helper'

RSpec.describe 'api/v1/facts', type: :request do
  # Initialize the test data
  let!(:user) { FactoryBot.create(:user)}
  let!(:member) { FactoryBot.create(:member, user: user) }
  let!(:facts) { FactoryBot.create_list(:fact, 20, member_id: member.id) }
  let!(:member_id) { member.id }
  let!(:fact_id) { facts.first.id }
  before :each do
    sign_in user
  end

  path '/api/v1/members/{member_id}/facts' do
    parameter name: 'member_id', in: :path, type: :string, description: 'member_id'

    get('list facts') do
      tags 'Facts'
      response(200, 'successful') do

        after do |example|
          example.metadata[:response][:examples] = { 'application/json' => JSON.parse(response.body, symbolize_names: true) }
        end
        run_test!
      end
    end

    post('create fact') do
      tags 'Facts'
      consumes 'application/json'
      produces 'application/json'
      parameter name: :fact, in: :body, required: true, schema: {
        type: :object,
        required: %i[fact_text likes],
        properties: {
          fact_text: {type: :string},
          likes: {type: :integer}
        }
      }
      response(201, 'successful') do
        let(:fact) { { fact_text: "This is a fact.", likes: 15} }

        after do |example|
          example.metadata[:response][:examples] = { 'application/json' => JSON.parse(response.body, symbolize_names: true) }
        end
        run_test!
      end
    end
  end

  path '/api/v1/members/{member_id}/facts/{fact_id}' do
    parameter name: 'member_id', in: :path, type: :string, description: 'member_id'
    parameter name: 'fact_id', in: :path, type: :string, description: 'id'

    get('show fact') do
      tags 'Facts'
      response(200, 'successful') do

        after do |example|
          example.metadata[:response][:examples] = { 'application/json' => JSON.parse(response.body, symbolize_names: true) }
        end
        run_test!
      end
    end

    patch('update fact') do
      tags 'Facts'
      consumes 'application/json'
      produces 'application/json'
      parameter name: :fact, in: :body, required: true, schema: {
        type: :object,
        properties: {
          fact_text: {type: :string},
          likes: {type: :integer}
        }
      }
      response(200, 'successful') do
        let(:fact) { {fact_text: "This is another fact."}}

        after do |example|
          example.metadata[:response][:examples] = { 'application/json' => JSON.parse(response.body, symbolize_names: true) }
        end
        run_test!
      end
    end

    put('update fact') do
      tags 'Facts'
      consumes 'application/json'
      produces 'application/json'
          parameter name: :fact, in: :body, required: true, schema: {
        type: :object,
        properties: {
          fact_text: {type: :string},
          likes: {type: :integer}
        }
      }
      response(200, 'successful') do
        let(:fact) {{ fact_text: "This is another fact." }}

        after do |example|
          example.metadata[:response][:examples] = { 'application/json' => JSON.parse(response.body, symbolize_names: true) }
        end
        run_test!
      end
    end

    delete('delete fact') do
      tags 'Facts'
      response(200, 'successful') do

        after do |example|
          example.metadata[:response][:examples] = { 'application/json' => JSON.parse(response.body, symbolize_names: true) }
        end
        run_test!
      end
    end
  end
end
```

Edit spec/swagger\_helper.rb to read as follows:

```
# frozen_string_literal: true

require 'rails_helper'

RSpec.configure do |config|
  # Specify a root folder where Swagger JSON files are generated
  # NOTE: If you're using the rswag-api to serve API descriptions, you'll need
  # to ensure that it's configured to serve Swagger from the same folder
  config.swagger_root = Rails.root.join('swagger').to_s

  # Define one or more Swagger documents and provide global metadata for each one
  # When you run the 'rswag:specs:swaggerize' rake task, the complete Swagger will
  # be generated at the provided relative path under swagger_root
  # By default, the operations defined in spec files are added to the first
  # document below. You can override this behavior by adding a swagger_doc tag to the
  # the root example_group in your specs, e.g. describe '...', swagger_doc: 'v2/swagger.json'
  config.swagger_docs = {
    'v1/swagger.yaml' => {
      openapi: '3.0.1',
      info: {
        title: 'API V1',
        version: 'v1'
      },
      paths: {},
      components: {
        securitySchemes: {
          CSRF_Protection: {
            description: "CSRF token",
            type: :apiKey,
            name: 'X-CSRF-Token',
            in: :header
          }
        }
      },
      security: [
        { "CSRF_Protection" => []}
      ],
      servers: [
        {
          url: "#{ENV['APPLICATION_URL']}"
          }
      ]
    }
  }

  # Specify the format of the output Swagger file when running 'rswag:specs:swaggerize'.
  # The swagger_docs configuration option has the filename including format in
  # the key, this may want to be changed to avoid putting yaml in json files.
  # Defaults to json. Accepts ':json' and ':yaml'.
  config.swagger_format = :yaml
end
```

You are really only changing two sections. You are changing the server section so that the swagger UI has the right URL, and you are also specifying what kind of authentication is to be used in the securitySchemes section.

Now run rspec. It should complete without errors. If not, you may have problems in your controller logic.

## Creating the Swagger UI

Type:

```
bundle exec rake rswag:specs:swaggerize
```

Then start your server as usual. You will find that you have a new route, so that you can, from your browser, access http://localhost:3000/api-docs . Experiment with this page, using the registrations section to create users and using the sessions section to log on. 

You will find that the logoff as well as all of the POST, PUT and DELETE request for members and facts don’t work. They return a long exception, because CSRF forgery checking is failing. This is because the CSRF token is not in the X-CSRF-Token header. You fix this as follows. Do the logon operation on the swagger page. You will see that the response comes back with a value in the X-CSRF-Token header. Copy that value, a long unintelligible string, to the clipboard. Then click on the authorize button at the upper right of the swagger page, and paste in the value. You will now find that the other operations complete correctly.

## Submitting Your Work

When you have verified that each of the operations on the swagger page works, you have completed the lesson. Use git to add, commit, and push your changes to the lesson13 branch, and then create a pull request as usual.

