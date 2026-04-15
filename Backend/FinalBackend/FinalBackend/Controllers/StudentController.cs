using FinalBackend.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace FinalBackend.Controllers
{
    public class StudentController : ApiController
    { FYPEntities2 db=new FYPEntities2();
        [HttpGet]
        public HttpResponseMessage GetStudentProfile(string AridNo)
        {
            try
            {
                var res = db.Students.Where(s => s.Reg_no == AridNo).FirstOrDefault();
                if (res == null)
                {
                    return Request.CreateErrorResponse(HttpStatusCode.NotFound, "Student not found");
                }
                return Request.CreateResponse(HttpStatusCode.OK, res);
            }
            catch (Exception ex)
            {
                return Request.CreateErrorResponse(HttpStatusCode.InternalServerError, ex.Message);
            }
        }



        //Get Student EnrollCourses 
        //[HttpGet]
        //public HttpResponseMessage GetStudentCourses(string AridNo, String session)
        //{
        //    try
        //    {
        //        var stud = db.Students.Where(s => s.Reg_no == AridNo && s.Session == session).FirstOrDefault();
        //        if (stud == null)
        //        {
        //            return Request.CreateErrorResponse(HttpStatusCode.NotFound, "Student not found for this semester");
        //        }
        //        var enrollCourses = db.CourseEnrollS.Where(e => e.Reg_no == stud.Reg_no).ToList();
        //        if (enrollCourses.Count == 0)
        //        {
        //            return Request.CreateErrorResponse(HttpStatusCode.NotFound, "No courses found for this student semester");
        //        }


        //        return Request.CreateResponse(HttpStatusCode.OK, enrollCourses);
        //    }
        //    catch (Exception ex)
        //    {
        //        return Request.CreateErrorResponse(HttpStatusCode.InternalServerError, ex.Message);
        //    }
        //}



        ////Check Evaluation Status
        //[HttpGet]
        //public HttpResponseMessage CheckEvaluationStatus(String AridNo)
        //{
        //    try
        //    {
        //        var res = db.Evaluation_Status.Where(e => e.AridNo == AridNo).ToList();
        //        if (res == null)
        //        {
        //            return Request.CreateErrorResponse(HttpStatusCode.NotFound, "No Evaluation status  found for this student");
        //        }
        //        bool p = res.Any(e => e.IsEvaluated == false);
        //        if (p)
        //        {
        //            return Request.CreateResponse(HttpStatusCode.OK, new { Status = "Pending", Message = "Evaluation Is Pending" });
        //        }
        //        return Request.CreateResponse(HttpStatusCode.OK, new { Status = "Completed", Message = "All evaluations completed. Logout allowed." });
        //    }
        //    catch (Exception ex)
        //    {
        //        return Request.CreateErrorResponse(HttpStatusCode.InternalServerError, ex.Message);
        //    }

        //}



        //Get Evaluation Questions
        //[HttpGet]
        //public HttpResponseMessage getEvaluationQuestions(String Qtype)
        //{
        //    try
        //    {
        //        var res = db.Questions.Where(q => q.Question_type == Qtype).ToList();
        //        if (res == null || res.Count == 0)
        //        {
        //            return Request.CreateErrorResponse(HttpStatusCode.NotFound, "Questions not found for evaluation");
        //        }
        //        return Request.CreateResponse(HttpStatusCode.OK, res);
        //    }
        //    catch (Exception ex)
        //    {
        //        return Request.CreateErrorResponse(HttpStatusCode.InternalServerError, ex.Message);
        //    }
        //}
        //private decimal calculateWeightedAverage(int responseId)
        //{
        //    var res = db.evaluationanswers.Where(a => a.responseid == responseId).ToList();
        //    if (res.Count == 0)
        //        return 0;

        //    decimal total = (decimal)res.Sum(a => a.rating);
        //    decimal count = res.Count;

        //    return Math.Round(total / count, 2);
        //}

        // Submit Evaluation Answers

        //[HttpPost]
        //public HttpResponseMessage submitEvaluationAnswers(string AridNo, string TeacherId, string CourseCode, evaluationanswer[] ea, string Comments)
        //{
        //    try
        //    {
        //        evaluationrespons res = new evaluationrespons
        //        {
        //            aridno = AridNo,
        //            teacherid = TeacherId,
        //            coursecode = CourseCode,
        //            evaltype = "student",
        //            comment = Comments,
        //            createdat = DateTime.Now
        //        };

        //        db.evaluationresponses.Add(res);
        //        db.SaveChanges();

        //        foreach (var ans in ea)
        //        {
        //            evaluationanswer a = new evaluationanswer
        //            {
        //                responseid = ans.responseid,
        //                questionid = ans.questionid,
        //                rating = ans.rating
        //            };
        //            db.evaluationanswers.Add(ans);
        //        }
        //        db.SaveChanges();


        //        decimal wa = calculateWeightedAverage(res.responseid);
        //        return Request.CreateResponse(HttpStatusCode.OK, $"evaluation submitted successfully{wa}");
        //    }
        //    catch (Exception ex)
        //    {
        //        return Request.CreateErrorResponse(HttpStatusCode.InternalServerError, ex.Message);
        //    }
        //}


        //Check if Already Evaluated
        //[HttpGet]
        //public HttpResponseMessage checkIfAlreadyEvaluated(string AridNo, string CourseCode)
        //{
        //    try
        //    {
        //        var res = db.evaluationresponses.Where(e => e.aridno == AridNo && e.coursecode == CourseCode).FirstOrDefault();
        //        if (res != null)
        //        {
        //            return Request.CreateResponse(HttpStatusCode.OK, true);
        //        }
        //        return Request.CreateResponse(HttpStatusCode.OK, false);
        //    }
        //    catch (Exception ex)
        //    {
        //        return Request.CreateErrorResponse(HttpStatusCode.InternalServerError, ex.Message);
        //    }
        //}
    }
}
