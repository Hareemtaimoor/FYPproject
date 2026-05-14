using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace FinalBackend.Controllers
{
    /// <summary>
    /// Director analytics / course–teacher comparison APIs.
    /// Replace TODO sections with your EF / stored procedures (allocated teachers, evaluation averages).
    /// </summary>
    public class DirectorController : ApiController
    {
        #region Request / response DTOs

        public class TeachersForCoursesBody
        {
            public string Session { get; set; }
            public List<string> CourseIds { get; set; }
        }

        public class ComparisonItemDto
        {
            /// <summary>Teacher id (camelCase teacherId from JSON).</summary>
            public string TeacherId { get; set; }

            public string CourseNo { get; set; }
        }

        public class GetComparisonDataBody
        {
            public string Session { get; set; }
            public List<int> QuestionIds { get; set; }
            public List<ComparisonItemDto> Items { get; set; }
            public List<string> TeacherIds { get; set; }
            public string CourseId { get; set; }
        }

        public class TeacherCourseRowDto
        {
            public string TeacherID { get; set; }
            public string TeacherName { get; set; }
            public string Designation { get; set; }
            public string CourseNo { get; set; }
            public string CourseName { get; set; }
        }

        public class ComparisonResultRowDto
        {
            public string TeacherID { get; set; }
            public string CourseNo { get; set; }
            public int QuestionNo { get; set; }
            public double AverageRating { get; set; }
        }

        #endregion

        /// <summary>Teachers allocated to a single course/session.</summary>
        [HttpGet]
        public HttpResponseMessage GetTeachersByCourse(string courseId, string session)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(courseId))
                    return Request.CreateErrorResponse(HttpStatusCode.BadRequest, "courseId is required");

                var rows = QueryTeachersForCourse(courseId?.Trim(), session?.Trim());
                return Request.CreateResponse(HttpStatusCode.OK, rows);
            }
            catch (Exception ex)
            {
                return Request.CreateErrorResponse(HttpStatusCode.InternalServerError, ex.Message);
            }
        }

        /// <summary>Teachers for many courses in one call (used by Compare screen with multiple subjects).</summary>
        [HttpPost]
        public HttpResponseMessage GetTeachersForCourses([FromBody] TeachersForCoursesBody body)
        {
            try
            {
                if (body == null || body.CourseIds == null || body.CourseIds.Count == 0)
                    return Request.CreateErrorResponse(HttpStatusCode.BadRequest, "CourseIds is required");

                var combined = new List<TeacherCourseRowDto>();
                var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

                foreach (var rawId in body.CourseIds.Where(x => !string.IsNullOrWhiteSpace(x)).Select(x => x.Trim()).Distinct())
                {
                    foreach (var row in QueryTeachersForCourse(rawId, body.Session?.Trim()))
                    {
                        var key = (row.TeacherID ?? "") + "|" + (row.CourseNo ?? "");
                        if (seen.Add(key))
                            combined.Add(row);
                    }
                }

                return Request.CreateResponse(HttpStatusCode.OK, combined);
            }
            catch (Exception ex)
            {
                return Request.CreateErrorResponse(HttpStatusCode.InternalServerError, ex.Message);
            }
        }

        [HttpGet]
        public HttpResponseMessage GetQuestionsList()
        {
            try
            {
                // TODO: return from Questions table
                var list = new[]
                {
                    new { Question_ID = 1, Question = "Course content was clear.", RawType = "FT" },
                    new { Question_ID = 2, Question = "Instructor was responsive.", RawType = "FT" },
                    new { Question_ID = 3, Question = "Assessment was fair.", RawType = "FE" },
                };
                return Request.CreateResponse(HttpStatusCode.OK, list);
            }
            catch (Exception ex)
            {
                return Request.CreateErrorResponse(HttpStatusCode.InternalServerError, ex.Message);
            }
        }

        /// <summary>
        /// Returns flat rows: TeacherID, CourseNo, QuestionNo, AverageRating — one per teacher–course–question.
        /// Supports Items (flexible) or legacy TeacherIds + CourseId.
        /// </summary>
        [HttpPost]
        public HttpResponseMessage GetComparisonData([FromBody] GetComparisonDataBody body)
        {
            try
            {
                if (body == null)
                    return Request.CreateErrorResponse(HttpStatusCode.BadRequest, "Body is required");

                var pairs = new List<ComparisonItemDto>();
                if (body.Items != null && body.Items.Count > 0)
                {
                    pairs.AddRange(body.Items.Where(x => x != null && !string.IsNullOrWhiteSpace(x.TeacherId) && !string.IsNullOrWhiteSpace(x.CourseNo)));
                }
                else if (body.TeacherIds != null && body.TeacherIds.Count > 0 && !string.IsNullOrWhiteSpace(body.CourseId))
                {
                    var cid = body.CourseId.Trim();
                    pairs.AddRange(body.TeacherIds.Where(t => !string.IsNullOrWhiteSpace(t)).Select(t => new ComparisonItemDto { TeacherId = t.Trim(), CourseNo = cid }));
                }

                if (pairs.Count == 0)
                    return Request.CreateErrorResponse(HttpStatusCode.BadRequest, "Provide Items (teacher+course pairs) or legacy TeacherIds + CourseId");

                var qids = (body.QuestionIds ?? new List<int>()).Distinct().ToList();
                if (qids.Count == 0)
                    return Request.CreateErrorResponse(HttpStatusCode.BadRequest, "QuestionIds must contain at least one question id.");

                var session = body.Session?.Trim() ?? "";
                var result = new List<ComparisonResultRowDto>();

                foreach (var p in pairs)
                {
                    foreach (var qid in qids)
                    {
                        var avg = QueryAverageRating(p.TeacherId, p.CourseNo, qid, session);
                        result.Add(new ComparisonResultRowDto
                        {
                            TeacherID = p.TeacherId,
                            CourseNo = p.CourseNo,
                            QuestionNo = qid,
                            AverageRating = avg
                        });
                    }
                }

                return Request.CreateResponse(HttpStatusCode.OK, result);
            }
            catch (Exception ex)
            {
                return Request.CreateErrorResponse(HttpStatusCode.InternalServerError, ex.Message);
            }
        }

        #region TODO: replace with real database queries

        /// <summary>Return teachers teaching this course in this session.</summary>
        private static List<TeacherCourseRowDto> QueryTeachersForCourse(string courseNo, string session)
        {
            // TODO: Example — join allocation / timetable tables:
            // SELECT DISTINCT t.Emp_no AS TeacherID, t.Name AS TeacherName, t.Designation, c.Course_no AS CourseNo, c.Course_name AS CourseName
            // FROM ... WHERE c.Course_no = @courseNo AND session = @session

            // Stub: empty so front-end still works; deploy with real query.
            return new List<TeacherCourseRowDto>();
        }

        /// <summary>Average rating for one teacher, course, question, session.</summary>
        private static double QueryAverageRating(string teacherId, string courseNo, int questionId, string session)
        {
            // TODO: SELECT AVG(Rating) FROM evaluation_responses WHERE TeacherId = ... AND Course_no = ... AND Question_ID = ... AND Session = ...

            // Deterministic placeholder so charts are visible before DB wiring (remove in production).
            unchecked
            {
                var h = (teacherId ?? "").GetHashCode() ^ (courseNo ?? "").GetHashCode() ^ questionId ^ (session ?? "").GetHashCode();
                return Math.Round(3.0 + Math.Abs(h % 19) / 10.0, 1); // 3.0 – 4.8
            }
        }

        #endregion
    }
}
