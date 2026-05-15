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

        public class GetGradeDistributionBody
        {
            public List<string> TeacherIds { get; set; }
            public List<string> CourseIds { get; set; }
            public string Session { get; set; }

            /// <summary>Fallback binding when JSON uses camelCase only.</summary>
            public List<string> teacherIds { get; set; }
            public List<string> courseIds { get; set; }
            public string session { get; set; }
        }

        #endregion

        /// <summary>Allocated courses for session (React Native / RCEvaluation teacher-flow course picker).</summary>
        [HttpGet]
        public HttpResponseMessage GetAllocatedCourses(string session)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(session))
                    return Request.CreateErrorResponse(HttpStatusCode.BadRequest, "session is required");
                // TODO: join allocation + course master (see FYP2 DirectorController.GetAllocatedCourses).
                return Request.CreateResponse(HttpStatusCode.OK, new List<object>());
            }
            catch (Exception ex)
            {
                return Request.CreateErrorResponse(HttpStatusCode.InternalServerError, ex.Message);
            }
        }

        /// <summary>Allocated teachers for session (RCEvaluation teachers tab).</summary>
        [HttpGet]
        public HttpResponseMessage GetAllocatedTeachers(string session)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(session))
                    return Request.CreateErrorResponse(HttpStatusCode.BadRequest, "session is required");
                // TODO: join allocation + EMP master (FYP2 GetAllocatedTeachers).
                var list = new List<object>();
                if (list.Count == 0)
                {
                    list.Add(new { TeacherID = "STUB01", TeacherName = "Demo Teacher Alpha", Designation = "Assistant Professor" });
                    list.Add(new { TeacherID = "STUB02", TeacherName = "Demo Teacher Beta", Designation = "Lecturer" });
                }
                return Request.CreateResponse(HttpStatusCode.OK, list);
            }
            catch (Exception ex)
            {
                return Request.CreateErrorResponse(HttpStatusCode.InternalServerError, ex.Message);
            }
        }

        /// <summary>All distinct sessions (dropdown).</summary>
        [HttpGet]
        public HttpResponseMessage GetAllSessions()
        {
            try
            {
                // TODO: distinct sessions from allocation / registration.
                var sessions = new List<string>();
                if (sessions.Count == 0)
                    sessions.Add("2026FM");
                return Request.CreateResponse(HttpStatusCode.OK, sessions);
            }
            catch (Exception ex)
            {
                return Request.CreateErrorResponse(HttpStatusCode.InternalServerError, ex.Message);
            }
        }

        [HttpGet]
        public HttpResponseMessage GetTeacherAverageRatings(string session)
        {
            try
            {
                return Request.CreateResponse(HttpStatusCode.OK, new List<object>());
            }
            catch (Exception ex)
            {
                return Request.CreateErrorResponse(HttpStatusCode.InternalServerError, ex.Message);
            }
        }

        [HttpGet]
        public HttpResponseMessage GetPeerAverageRatings(string session)
        {
            try
            {
                return Request.CreateResponse(HttpStatusCode.OK, new List<object>());
            }
            catch (Exception ex)
            {
                return Request.CreateErrorResponse(HttpStatusCode.InternalServerError, ex.Message);
            }
        }

        /// <summary>Courses where every selected teacher has evaluation rows in this session (FYP2 DirectorController parity).</summary>
        [HttpGet]
        public HttpResponseMessage GetCommonCoursesBySession_Teachers(string session, string teacherIds)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(session))
                    return Request.CreateErrorResponse(HttpStatusCode.BadRequest, "session is required");
                if (string.IsNullOrWhiteSpace(teacherIds))
                    return Request.CreateErrorResponse(HttpStatusCode.BadRequest, "teacherIds is required");

                // TODO: EF join Evals + STMTR + ALLOCATE matching FYP2 query.
                var ids = teacherIds.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries)
                    .Select(s => s.Trim())
                    .Where(s => s.Length > 0)
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList();
                if (ids.Count == 0)
                    return Request.CreateResponse(HttpStatusCode.OK, new List<object>());

                // Stub so TeacherPerformanceDashboard can load before DB wiring.
                var sample = new[]
                {
                    new { Course_no = "DEMO101", Course_desc = "Demonstration course (stub data)" },
                    new { Course_no = "DEMO102", Course_desc = "Second demo course (stub)" }
                };
                return Request.CreateResponse(HttpStatusCode.OK, sample.ToList());
            }
            catch (Exception ex)
            {
                return Request.CreateErrorResponse(HttpStatusCode.InternalServerError, ex.Message);
            }
        }

        /// <summary>Per-question average marks for one teacher, session, and course (student evaluations).</summary>
        [HttpGet]
        public HttpResponseMessage GetTeacherStudentEvalDetails(string teacherId, string session, string courseId)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(teacherId) || string.IsNullOrWhiteSpace(session) || string.IsNullOrWhiteSpace(courseId))
                    return Request.CreateErrorResponse(HttpStatusCode.BadRequest, "teacherId, session, and courseId are required");

                // TODO: EF group Evals joined with STMTR as in FYP2.
                var rows = StubEvalQuestionRows(teacherId, session, courseId);
                return Request.CreateResponse(HttpStatusCode.OK, rows);
            }
            catch (Exception ex)
            {
                return Request.CreateErrorResponse(HttpStatusCode.InternalServerError, ex.Message);
            }
        }

        /// <summary>Per-question peer averages for one teacher (session parameter reserved for future filtering).</summary>
        [HttpGet]
        public HttpResponseMessage GetTeacherPeerEvalDetails(string teacherId, string session)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(teacherId))
                    return Request.CreateErrorResponse(HttpStatusCode.BadRequest, "teacherId is required");

                // TODO: EF PeerEvaluations grouped by Question_Desc.
                var rows = StubEvalQuestionRows(teacherId, session ?? "", "PEER");
                return Request.CreateResponse(HttpStatusCode.OK, rows);
            }
            catch (Exception ex)
            {
                return Request.CreateErrorResponse(HttpStatusCode.InternalServerError, ex.Message);
            }
        }

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

        /// <summary>
        /// Grade band counts per teacher for selected courses (React Native TeacherGradeDashboard).
        /// Replace stub with real aggregation from marks / GPA tables.
        /// </summary>
        [HttpPost]
        public HttpResponseMessage GetGradeDistribution([FromBody] GetGradeDistributionBody body)
        {
            try
            {
                if (body == null)
                    return Request.CreateErrorResponse(HttpStatusCode.BadRequest, "Body is required");

                var teacherIds = MergeStringLists(body.TeacherIds, body.teacherIds)
                    .Where(x => !string.IsNullOrWhiteSpace(x))
                    .Select(x => x.Trim())
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList();

                if (teacherIds.Count == 0)
                    return Request.CreateErrorResponse(HttpStatusCode.BadRequest, "TeacherIds is required");

                var courseIds = MergeStringLists(body.CourseIds, body.courseIds)
                    .Where(x => !string.IsNullOrWhiteSpace(x))
                    .Select(x => x.Trim())
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList();

                var session = (body.Session ?? body.session ?? "").Trim();

                // TODO: EF — count students in A/B/C/D bands per teacher for courseIds in session.
                var rows = StubGradeDistributionRows(teacherIds, courseIds, session);
                return Request.CreateResponse(HttpStatusCode.OK, rows);
            }
            catch (Exception ex)
            {
                return Request.CreateErrorResponse(HttpStatusCode.InternalServerError, ex.Message);
            }
        }

        #region Confidential evaluation (same payloads as regular; swap implementation when ConfEval DB is wired)

        [HttpGet]
        public HttpResponseMessage GetConfidentialAllocatedCourses(string session) => GetAllocatedCourses(session);

        [HttpGet]
        public HttpResponseMessage GetConfidentialAllocatedTeachers(string session) => GetAllocatedTeachers(session);

        [HttpGet]
        public HttpResponseMessage GetConfidentialTeacherAverageRatings(string session) => GetTeacherAverageRatings(session);

        [HttpGet]
        public HttpResponseMessage GetConfidentialPeerAverageRatings(string session) => GetPeerAverageRatings(session);

        [HttpGet]
        public HttpResponseMessage GetConfidentialTeachersByCourse(string courseId, string session) => GetTeachersByCourse(courseId, session);

        [HttpPost]
        public HttpResponseMessage GetConfidentialTeachersForCourses([FromBody] TeachersForCoursesBody body) => GetTeachersForCourses(body);

        [HttpGet]
        public HttpResponseMessage GetConfidentialQuestionsList() => GetQuestionsList();

        [HttpPost]
        public HttpResponseMessage GetConfidentialComparisonData([FromBody] GetComparisonDataBody body) => GetComparisonData(body);

        [HttpGet]
        public HttpResponseMessage GetConfidentialCommonCoursesBySession_Teachers(string session, string teacherIds) =>
            GetCommonCoursesBySession_Teachers(session, teacherIds);

        [HttpGet]
        public HttpResponseMessage GetConfidentialTeacherStudentEvalDetails(string teacherId, string session, string courseId) =>
            GetTeacherStudentEvalDetails(teacherId, session, courseId);

        [HttpGet]
        public HttpResponseMessage GetConfidentialTeacherPeerEvalDetails(string teacherId, string session) =>
            GetTeacherPeerEvalDetails(teacherId, session);

        #endregion

        #region TODO: replace with real database queries

        private static IEnumerable<string> MergeStringLists(params List<string>[] lists)
        {
            foreach (var list in lists)
            {
                if (list == null) continue;
                foreach (var item in list)
                    yield return item;
            }
        }

        /// <summary>Stub grade counts (GradeA–GradeD) per teacher for chart development.</summary>
        private static List<object> StubGradeDistributionRows(List<string> teacherIds, List<string> courseIds, string session)
        {
            var list = new List<object>();
            var courseSeed = string.Join("|", courseIds);

            foreach (var tid in teacherIds)
            {
                unchecked
                {
                    var h = (tid ?? "").GetHashCode() ^ (session ?? "").GetHashCode() ^ (courseSeed ?? "").GetHashCode();
                    var total = 28 + Math.Abs(h % 24);
                    var a = Math.Max(0, total * (18 + (h % 7)) / 100);
                    var b = Math.Max(0, total * (28 + ((h >> 3) % 9)) / 100);
                    var c = Math.Max(0, total * (22 + ((h >> 5) % 8)) / 100);
                    var d = Math.Max(0, total - a - b - c);
                    list.Add(new
                    {
                        TeacherID = tid,
                        TeacherName = "Teacher " + tid,
                        GradeA = a,
                        GradeB = b,
                        GradeC = c,
                        GradeD = d
                    });
                }
            }

            return list;
        }

        /// <summary>Stub rows <c>label</c> / <c>score</c> for director performance charts until EF queries are wired.</summary>
        private static List<object> StubEvalQuestionRows(string teacherId, string session, string courseId)
        {
            var rows = new List<object>();
            for (var q = 1; q <= 5; q++)
            {
                unchecked
                {
                    var h = (teacherId ?? "").GetHashCode() ^ q ^ (session ?? "").GetHashCode() ^ (courseId ?? "").GetHashCode();
                    var score = 3.0 + Math.Abs(h % 20) / 10.0;
                    rows.Add(new { label = "Q" + q, score = Math.Round(score, 1) });
                }
            }
            return rows;
        }

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
