// routes/coursesRoutes.js
const express = require("express");
const router = express.Router();
const controller = require("../controllers/coursesController");
const upload = require("../middleware/s3Upload"); // Updated to S3 upload
const { verifyToken } = require("../middleware/socketAuth");

// ========================= COURSE MANAGEMENT ROUTES =========================

// ✅ Create course (with S3 upload)
router.post(
  "/creates",
  verifyToken,
  upload.fields([
    { name: "courseThumbnail", maxCount: 1 },
    ...Array.from({ length: 20 }, (_, i) => ({
      name: `classThumbnail${i}`,
      maxCount: 1,
    })),
  ]),
  controller.createCourse
);

// ✅ Get all courses
router.get("/all", controller.getAllCourses);

// ✅ Get course options/pricing
router.get("/courseoptions", controller.getCourseOptions);

// ✅ Get single course
router.get("/all/:id", controller.getCourse);

// ✅ Update course (with S3 upload)
router.put(
  "/edit/:id",
  verifyToken,
  upload.fields([{ name: "courseThumbnail", maxCount: 1 }]),
  controller.updateCourse
);

// ✅ Delete course
router.delete("/delete/:id", verifyToken, controller.deleteCourse);

// ✅ Enroll student
router.post("/:id/enroll", verifyToken, controller.enrollStudent);

// ✅ Get active/enrolled courses
router.get("/active", verifyToken, controller.getActiveCoursesForStudent);

// ✅ Get trainers for student
router.get("/:studentid/trainers", verifyToken, controller.getTrainersForStudentCourses);

// ✅ Get students for trainer
router.get("/:trainerid/students", verifyToken, controller.getStudentsForTrainer);

// ========================= CLASS SCHEDULE ROUTES =========================

// ✅ Get student's enrolled classes
router.get(
  "/student/:studentId/enrolled-classes",
  verifyToken,
  controller.getStudentEnrolledClasses
);

// ✅ Allocate single class
router.post("/allocate-class", verifyToken, controller.allocateClassToStudent);

// ✅ Bulk allocate classes
router.post("/bulk-allocate-classes", verifyToken, controller.bulkAllocateClasses);

// ✅ Get student schedules
router.get("/schedules/student/:studentId", verifyToken, controller.getStudentSchedules);
router.get("/schedules/student", verifyToken, controller.getStudentSchedules);

// ✅ Get trainer schedules
router.get("/schedules/trainer/:trainerId", verifyToken, controller.getTrainerSchedules);
router.get("/schedules/trainer", verifyToken, controller.getTrainerSchedules);

// ✅ Get single schedule
router.get("/schedule/:scheduleId", verifyToken, controller.getScheduleById);

// ✅ Get trainer reports
router.get("/reports/trainer/:trainerId", verifyToken, controller.getreports);

// ✅ Update schedule
router.put("/schedule/:scheduleId", verifyToken, controller.updateSchedule);

// ✅ Delete schedule
router.delete("/schedule/:scheduleId", verifyToken, controller.deleteSchedule);

module.exports = router;