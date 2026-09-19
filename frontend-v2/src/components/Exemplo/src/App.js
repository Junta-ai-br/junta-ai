import React, { useState } from "react";
import {GoogleLogin, GoogleOAuthProvider} from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
function App() {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [profilePic, setProfilePic] = useState();
	const [isLoggedIn, setIsLoggedIn] = useState(false);

	const responseGoogle = (response) => {
		const decoded = jwtDecode(response.credential);
		setName(decoded.name);
		setEmail(decoded.email);
		setProfilePic(decoded.picture);
		setIsLoggedIn(true);
	};
	return (
	<GoogleOAuthProvider clientId="54882129496-8n6pbldj3p4t42fi58th90bou6riii7n.apps.googleusercontent.com">
	<div className="App">
		<GoogleLogin
			onSuccess={responseGoogle}
			onError={() => {
				console.log("Login Failed");
			}}
		/>
		{isLoggedIn ? (
			<div>
				<h1>User Information</h1>
				<div>
					<img src={profilePic} alt="Profile" />
					<p>Name: {name}</p>
					<p>Email: {email}</p>
				</div>
			</div>
		) : null}
	</div>
	</GoogleOAuthProvider>
	);
}

export default App;