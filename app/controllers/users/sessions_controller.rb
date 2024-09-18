class Users::SessionsController < Devise::SessionsController
  respond_to :json
  skip_forgery_protection only: [:create]

  def destroy 
    @logged_in_user = current_user
    super 
  end

  private

  def respond_with(resource, _opts = {})
    if !resource.id.nil?
      cookies["CSRF-TOKEN"] = form_authenticity_token
      response.set_header('X-CSRF-Token', form_authenticity_token)
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
