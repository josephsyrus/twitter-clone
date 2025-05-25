import { Route, Routes } from "react-router-dom"
 
import LoginPage from "./pages/auth/login/LoginPage"
import SignupPage from "./pages/auth/signup/SignupPage"
import HomePage from "./pages/home/HomePage"
import Sidebar from "./components/common/Sidebar"
import RightPanel from "./components/common/RightPanel"
import NotificationPage from "./pages/notification/NotificationPage"
import ProfilePage from "./pages/profile/ProfilePage"

function App() {

  return (
    <div className="flex max-w-6xl mx-auto">
      {/*here Sidebar and RightPanel are common components, so they will render in every page*/}
      <Sidebar/>
      <Routes>
        <Route path='/' element={<HomePage/>}/>
        <Route path='/login' element={<LoginPage/>}/>
        <Route path='/signup' element={<SignupPage/>}/>
        <Route path='/notifications' element={<NotificationPage/>}/>
        <Route path='/profile/:username' element={<ProfilePage/>}/>
      </Routes>
      <RightPanel/>
    </div>
  )
}

export default App
