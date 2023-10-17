function handle_session() {
  console.log('DOM fully loaded and parsed');
  const resultsDiv = document.getElementById('results-div');
  const restOpsDiv = document.getElementById('rest-ops');
  const logonButton = document.getElementById('logon');
  const logoffButton = document.getElementById('logoff');
  const createUserButton = document.getElementById('create-user');
  const userEmail = document.getElementById('user-email');
  const userPassword = document.getElementById('user-password');
  const userEmail1 = document.getElementById('user-email1');
  const userPassword1 = document.getElementById('user-password1');
  const users_path = '/users';

  restOpsDiv.addEventListener('click', (event) => {
    if (event.target === logonButton) {
      var dataObject = {
        "user": {
          email: userEmail1.value,
          password: userPassword1.value
        }
      };
      fetch(`${users_path}/sign_in`,
        { method: 'POST',
          mode: 'cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataObject)
        }
      ).then((response) => {
        if (response.status === 201) {
          resultsDiv.innerHTML = '';
          response.json().then((data) => {
            let parag = document.createElement('P');
            parag.textContent = JSON.stringify(data);
            resultsDiv.appendChild(parag);
            response.headers.forEach(function(val, key) {
              parag2 = document.createElement('P');
              parag2.textContent = `${key} ${val}`
              resultsDiv.appendChild(parag2);
            });
            localStorage.setItem("authHeader",response.headers.get('authorization'));
          });
        } else {
          alert(`Return code ${response.status} ${response.statusText}`);
        }
      }).catch((error) => {
        console.log(error);
        alert(error);
      });
    } else if (event.target === createUserButton) {
      var dataObject = {
        "user": {
          email: userEmail.value,
          password: userPassword.value
        }
      }
      fetch(users_path,
        { method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataObject)
        }
      ).then((response) => {
        if (response.status === 201) {
          response.json().then((data) => {
            resultsDiv.innerHTML = '';
            let parag = document.createElement('P');
            parag.textContent = JSON.stringify(data);
            resultsDiv.appendChild(parag);
          });
        } else {
          response.json().then((data) => {
            alert(`Return code ${response.status} ${response.statusText} ${JSON.stringify(data)}`);
          }).catch((error) => {
            console.log(error);
            alert(error);
          });
        }
      });
    } else if (event.target === logoffButton) {
      fetch(`${users_path}/sign_out`,
        { method: 'DELETE',
          headers: { 'Content-Type': 'application/json',
            'authorization': localStorage.getItem("authHeader") },
        }
      ).then((response) => {
        if (response.status === 200) {
          response.json().then((data) => {
            resultsDiv.innerHTML = '';
            let parag = document.createElement('P');
            parag.textContent = JSON.stringify(data);
            resultsDiv.appendChild(parag);
          });
        } else {
          response.json().then((data) => {
            alert(`Return code ${response.status} ${response.statusText} ${JSON.stringify(data)}`);
          }).catch((error) => {
            console.log(error);
            alert(error);
          });
        }
      });
      localStorage.removeItem("authHeader");
    }
  });
}
document.addEventListener('DOMContentLoaded', handle_session());
