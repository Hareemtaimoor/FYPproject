using FinalBackend.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace FinalBackend.Controllers
{
    public class LoginController : ApiController
    {
        FYPEntities2 db = new FYPEntities2();
        [HttpGet]
        public HttpResponseMessage GetAllUsers()
        {
            try
            {
                var users = db.Logins.ToList();
                return Request.CreateResponse(HttpStatusCode.OK, users);
            }
            catch (Exception ex)
            {
                return Request.CreateErrorResponse(HttpStatusCode.InternalServerError, ex.Message);
            }
        }

        //Login User
        [HttpGet]
        public HttpResponseMessage LoginUser(string username, string password)
        {
            try
            {
                var user = db.Logins.Where(u => u.User_id == username && u.User_password == password).FirstOrDefault();
                if (user == null)
                {
                    return Request.CreateErrorResponse(HttpStatusCode.Unauthorized, "Invalid username or password");
                }
                return Request.CreateResponse(HttpStatusCode.OK, user);
            }
            catch (Exception ex)
            {
                return Request.CreateErrorResponse(HttpStatusCode.InternalServerError, ex.Message);
            }
        }

        //Logout User
        [HttpPost]
        public HttpResponseMessage LogoutUser(String username)
        {
            try
            {
                ;
                var user = db.Logins.Where(u => u.User_name == username).FirstOrDefault();
                if (user == null)
                {
                    return Request.CreateErrorResponse(HttpStatusCode.NotFound, "User not found");
                }
                return Request.CreateResponse(HttpStatusCode.OK, "User logged out successfully");
            }
            catch (Exception ex)
            {
                return Request.CreateErrorResponse(HttpStatusCode.InternalServerError, ex.Message);
            }
        }
    }
}
