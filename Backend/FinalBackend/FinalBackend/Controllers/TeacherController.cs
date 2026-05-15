using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using FinalBackend.Models;

namespace FinalBackend.Controllers
{
    /// <summary>
    /// Teacher profile, attendance, CHR, and peer stubs — wire to your database / stored procedures.
    /// </summary>
    public class TeacherController : ApiController
    {
        private readonly FYPEntities2 _db = new FYPEntities2();

        [HttpGet]
        public HttpResponseMessage GetTeacherProfile(string TeacherID)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(TeacherID))
                    return Request.CreateErrorResponse(HttpStatusCode.BadRequest, "TeacherID is required");

                var id = TeacherID.Trim();
                var login = _db.Logins.FirstOrDefault(l => l.User_id == id);
                var name = login?.User_name?.Trim();
                if (string.IsNullOrEmpty(name)) name = id;

                var payload = new
                {
                    TeacherID = id,
                    TeacherName = name,
                    Name = name,
                    Designation = "Faculty",
                    EmpNo = id
                };
                return Request.CreateResponse(HttpStatusCode.OK, payload);
            }
            catch (Exception ex)
            {
                return Request.CreateErrorResponse(HttpStatusCode.InternalServerError, ex.Message);
            }
        }

        [HttpGet]
        public HttpResponseMessage GetTeacherDateRange(string teacherId)
        {
            try
            {
                var end = DateTime.Today;
                var start = end.AddDays(-45);
                return Request.CreateResponse(HttpStatusCode.OK, new
                {
                    Start = start.ToString("yyyy-MM-dd"),
                    End = end.ToString("yyyy-MM-dd")
                });
            }
            catch (Exception ex)
            {
                return Request.CreateErrorResponse(HttpStatusCode.InternalServerError, ex.Message);
            }
        }

        [HttpGet]
        public HttpResponseMessage GetTeacherAttendanceRange(string teacherId, string start, string end)
        {
            try
            {
                return Request.CreateResponse(HttpStatusCode.OK, new object[0]);
            }
            catch (Exception ex)
            {
                return Request.CreateErrorResponse(HttpStatusCode.InternalServerError, ex.Message);
            }
        }

        [HttpPost]
        public HttpResponseMessage AddAttendanceComments(int attendanceId, string teacherId, string comments)
        {
            try
            {
                return Request.CreateResponse(HttpStatusCode.OK, "OK");
            }
            catch (Exception ex)
            {
                return Request.CreateErrorResponse(HttpStatusCode.InternalServerError, ex.Message);
            }
        }

        /// <summary>Dates that have (or may have) CHR rows — used by CHR.jsx date dropdown.</summary>
        [HttpGet]
        public HttpResponseMessage GetAvailableCHRDates(string tId)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(tId))
                    return Request.CreateErrorResponse(HttpStatusCode.BadRequest, "tId is required");

                var list = new List<string>();
                for (var i = 0; i < 90; i++)
                {
                    var d = DateTime.Today.AddDays(-i);
                    list.Add(d.ToString("yyyy-MM-dd"));
                }
                return Request.CreateResponse(HttpStatusCode.OK, list);
            }
            catch (Exception ex)
            {
                return Request.CreateErrorResponse(HttpStatusCode.InternalServerError, ex.Message);
            }
        }

        public class ChrReportRowDto
        {
            public int SrNo { get; set; }
            public string Course { get; set; }
            public string Discipline_Section { get; set; }
            public string Venue { get; set; }
            public string Status { get; set; }
        }

        /// <summary>
        /// Class-held report for one teacher and date. Always returns HTTP 200 with Reports array
        /// (empty when none) so the SPA does not treat "no rows" as a hard failure.
        /// </summary>
        [HttpGet]
        public HttpResponseMessage GetTeacherCHR(string tId, string date)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(tId))
                    return Request.CreateErrorResponse(HttpStatusCode.BadRequest, "tId is required");
                if (string.IsNullOrWhiteSpace(date))
                    return Request.CreateErrorResponse(HttpStatusCode.BadRequest, "date is required");

                var id = tId.Trim();
                var login = _db.Logins.FirstOrDefault(l => l.User_id == id);
                var name = login?.User_name?.Trim();
                if (string.IsNullOrEmpty(name)) name = id;

                // TODO: query CHR / timetable tables for `date`.
                var reports = new List<ChrReportRowDto>();

                var body = new
                {
                    Profile = new
                    {
                        TeacherID = id,
                        TeacherName = name,
                        Name = name,
                        Designation = "Faculty"
                    },
                    Reports = reports
                };
                return Request.CreateResponse(HttpStatusCode.OK, body);
            }
            catch (Exception ex)
            {
                return Request.CreateErrorResponse(HttpStatusCode.InternalServerError, ex.Message);
            }
        }

        [HttpGet]
        public HttpResponseMessage GetAllTeachers()
        {
            return Request.CreateResponse(HttpStatusCode.OK, new object[0]);
        }

        [HttpGet]
        public HttpResponseMessage GetAllFaculty()
        {
            return Request.CreateResponse(HttpStatusCode.OK, new object[0]);
        }

        [HttpPost]
        public HttpResponseMessage SavePeerAssignment([FromBody] List<string> body)
        {
            return Request.CreateResponse(HttpStatusCode.OK, "OK");
        }
    }
}
