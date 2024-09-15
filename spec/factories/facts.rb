require 'faker'

FactoryBot.define do
  factory :fact do
    fact_text { Faker::ChuckNorris.fact }
    likes { Faker::Number.number(digits: 3).to_i }
    association :member
  end
end
# ```## Creating the Rspec Tests

# We need to create tests for each of the controllers. Our tests must authenticate a user. For this, we need the Devise test helpers. So add this line to the bottom of spec/rails\_helper.rb, just before the final end:

# ```ruby
#   config.include Devise::Test::IntegrationHelpers, type: :request