/**
 * TeacherGradeDashboard — React Native (corrected)
 *
 * WHY THE OLD GRAPH FAILED:
 * react-native-chart-kit's <BarChart> only renders datasets[0]. Extra teachers in
 * datasets[1], datasets[2], … are ignored, so you never saw “all” teachers on one chart.
 *
 * FIX:
 * - One BarChart per teacher (A–D counts), in a horizontal ScrollView for comparison.
 * - Optional: single full-width chart when there is only one teacher.
 * - Widen charts / scroll so bars are not clipped.
 * - Normalize GradeA / gradeA from API; validate courses before POST.
 *
 * Copy this file into your RN project (adjust paths for APIEndPoint / images).
 */
import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { BarChart } from "react-native-chart-kit";
import axios from "axios";
import APIEndPoint from "../../APIEndPoint";

const { width } = Dimensions.get("window");
const GRADES = ["A", "B", "C", "D"];
const colorPalette = ["#FFD700", "#FF8C00", "#AF52DE", "#FF2D55", "#5856D6", "#34C759"];

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function gradeCounts(row) {
  return [
    num(row.GradeA ?? row.gradeA),
    num(row.GradeB ?? row.gradeB),
    num(row.GradeC ?? row.gradeC),
    num(row.GradeD ?? row.gradeD),
  ];
}

const TeacherGradeDashboard = ({ navigation }) => {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState("");
  const [teachers, setTeachers] = useState([]);
  const [selectedTeachers, setSelectedTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [gradeData, setGradeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const teacherIdsCsv = useMemo(
    () => selectedTeachers.map((t) => t.TeacherID).filter(Boolean).join(","),
    [selectedTeachers]
  );

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await axios.get(`${APIEndPoint}/Director/GetAllSessions`);
        const raw = Array.isArray(res.data) ? res.data : [];
        setSessions(raw);
      } catch {
        Alert.alert("Error", "Sessions load nahi ho sakay.");
      }
    };
    fetchSessions();
  }, []);

  useEffect(() => {
    if (!selectedSession) return;
    const fetchTeachers = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${APIEndPoint}/Director/GetAllocatedTeachers?session=${encodeURIComponent(selectedSession)}`
        );
        const list = Array.isArray(res.data) ? res.data : [];
        setTeachers(list);
        setSelectedTeachers([]);
        setCourses([]);
        setSelectedCourses([]);
        setShowResults(false);
        setGradeData(null);

        try {
          const ratingRes = await axios.get(
            `${APIEndPoint}/Director/GetTeacherAverageRatings?session=${encodeURIComponent(selectedSession)}`
          );
          const ratings = Array.isArray(ratingRes.data) ? ratingRes.data : [];
          setTeachers((prev) =>
            prev.map((teacher) => {
              const tid = String(teacher.TeacherID ?? "").trim().toUpperCase();
              const r = ratings.find(
                (x) => String(x.TeacherID ?? "").trim().toUpperCase() === tid
              );
              const ar = r?.AverageRating ?? r?.averageRating;
              return {
                ...teacher,
                AverageRating:
                  r != null && ar != null && ar !== "" ? Number(ar).toFixed(1) : "N/A",
              };
            })
          );
        } catch {
          /* optional */
        }
      } catch {
        Alert.alert("Error", "Teachers load nahi ho sakay.");
        setTeachers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTeachers();
  }, [selectedSession]);

  useEffect(() => {
    if (selectedTeachers.length === 0 || !selectedSession || !teacherIdsCsv) {
      setCourses([]);
      setSelectedCourses([]);
      setShowResults(false);
      setGradeData(null);
      return;
    }
    const fetchCourses = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${APIEndPoint}/Director/GetCommonCoursesBySession_Teachers?session=${encodeURIComponent(
            selectedSession
          )}&teacherIds=${encodeURIComponent(teacherIdsCsv)}`
        );
        const raw = Array.isArray(res.data) ? res.data : [];
        setCourses(
          raw.map((c) => ({
            CourseID: String(c.Course_no ?? c.CourseNo ?? "").trim(),
            CourseName: String(c.Course_desc ?? c.CourseName ?? "").trim(),
          })).filter((c) => c.CourseID)
        );
        setSelectedCourses((prev) =>
          prev.filter((id) =>
            raw.some((c) => String(c.Course_no ?? c.CourseNo ?? "").trim() === id)
          )
        );
        setShowResults(false);
        setGradeData(null);
      } catch {
        Alert.alert("Error", "Courses load nahi ho sakay.");
        setCourses([]);
        setSelectedCourses([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [selectedSession, teacherIdsCsv]);

  const toggleTeacher = (teacher) => {
    setSelectedTeachers((prev) => {
      const exists = prev.find((t) => t.TeacherID === teacher.TeacherID);
      if (exists) return prev.filter((t) => t.TeacherID !== teacher.TeacherID);
      return [...prev, teacher];
    });
    setShowResults(false);
    setGradeData(null);
  };

  const toggleCourse = (courseID) => {
    setSelectedCourses((prev) =>
      prev.includes(courseID) ? prev.filter((id) => id !== courseID) : [...prev, courseID]
    );
    setShowResults(false);
    setGradeData(null);
  };

  const fetchGradeData = async () => {
    if (selectedTeachers.length === 0 || !selectedSession) {
      Alert.alert("Error", "Please select Session and at least one Teacher");
      return;
    }
    if (selectedCourses.length === 0) {
      Alert.alert("Error", "Please select at least one common course.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        TeacherIds: selectedTeachers.map((t) => t.TeacherID),
        CourseIds: selectedCourses,
        Session: selectedSession,
      };
      const res = await axios.post(`${APIEndPoint}/Director/GetGradeDistribution`, payload);
      const rows = Array.isArray(res.data) ? res.data : [];
      if (rows.length > 0) {
        setGradeData(rows);
        setShowResults(true);
      } else {
        Alert.alert("No Data", "Selected criteria ka result nahi mila.");
        setShowResults(false);
        setGradeData(null);
      }
    } catch (error) {
      const msg =
        error?.response?.data?.Message ||
        error?.response?.data ||
        error?.message ||
        "Request failed";
      Alert.alert("Error", typeof msg === "string" ? msg : "Data fetch karne mein masla hua.");
      setShowResults(false);
      setGradeData(null);
    } finally {
      setLoading(false);
    }
  };

  /** One chart per teacher — chart-kit BarChart only uses datasets[0]. */
  const renderTeacherCharts = useCallback(() => {
    if (!gradeData?.length) return null;

    const cardWidth = Math.min(width * 0.88, Math.max(220, 56 * GRADES.length + 56));
    const chartInnerWidth = cardWidth - 24;
    const chartHeight = 220;

    return (
      <ScrollView
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator
        contentContainerStyle={ss.chartsRow}
      >
        {gradeData.map((teacher, idx) => {
          const counts = gradeCounts(teacher);
          const barColors = counts.map(() => () => colorPalette[idx % colorPalette.length]);
          const data = {
            labels: GRADES,
            datasets: [
              {
                data: counts,
                colors: barColors,
              },
            ],
          };
          const name = teacher.TeacherName ?? teacher.teacherName ?? teacher.TeacherID ?? `T${idx + 1}`;

          return (
            <View key={`${teacher.TeacherID ?? idx}-${idx}`} style={[ss.chartCard, { width: cardWidth }]}>
              <Text style={ss.chartCardTitle} numberOfLines={2}>
                {name}
              </Text>
              <BarChart
                data={data}
                width={chartInnerWidth}
                height={chartHeight}
                fromZero
                flatColor
                withCustomBarColorFromData
                chartConfig={{
                  backgroundColor: "#ffffff",
                  backgroundGradientFrom: "#ffffff",
                  backgroundGradientTo: "#ffffff",
                  decimalPlaces: 0,
                  color: () => "#333333",
                  labelColor: () => "#333333",
                  propsForBackgroundLines: { stroke: "#e0e0e0", strokeDasharray: "" },
                  barPercentage: 0.65,
                }}
                style={{ borderRadius: 12, marginVertical: 6 }}
              />
            </View>
          );
        })}
      </ScrollView>
    );
  }, [gradeData, width]);

  const selectedCourseLabel = useMemo(
    () =>
      courses
        .filter((c) => selectedCourses.includes(c.CourseID))
        .map((c) => c.CourseName || c.CourseID)
        .join(", "),
    [courses, selectedCourses]
  );

  return (
    <ScrollView contentContainerStyle={ss.main} showsVerticalScrollIndicator={false}>
      <View style={ss.topWrapper}>
        <View style={ss.logoContainer}>
          <Image style={ss.logo} source={require("../../../Images/Biit_Logo.png")} />
        </View>
        <View style={ss.profileCard}>
          <View style={ss.profileInfo}>
            <Text style={ss.pText}>
              Name: <Text style={ss.bold}>DR. JAMIL SAWAR</Text>
            </Text>
            <Text style={ss.pText}>
              Role: <Text style={ss.bold}>Director</Text>
            </Text>
            <Text style={ss.pSubText}>BIIT Administration</Text>
          </View>
          <Image style={ss.avatar} source={require("../../../Images/male.png")} />
        </View>
      </View>

      <Text style={ss.sectionTitle}>SELECT ACADEMIC SESSION</Text>
      <View style={ss.pickerContainer}>
        <Picker
          selectedValue={selectedSession}
          onValueChange={(v) => setSelectedSession(v)}
          style={ss.picker}
          dropdownIconColor="#0d2e27"
        >
          <Picker.Item label="Select Session..." value="" />
          {sessions.map((s, i) => (
            <Picker.Item key={`${String(s)}-${i}`} label={String(s)} value={String(s)} />
          ))}
        </Picker>
      </View>

      {selectedSession !== "" && (
        <>
          <Text style={ss.sectionTitle}>SELECT TEACHERS FOR COMPARISON</Text>
          <View style={ss.scrollBox}>
            <ScrollView nestedScrollEnabled>
              {teachers.map((t, index) => {
                const isSelected = !!selectedTeachers.find((x) => x.TeacherID === t.TeacherID);
                return (
                  <TouchableOpacity
                    key={String(t.TeacherID)}
                    style={[ss.teacherCard, isSelected && ss.cardActive]}
                    onPress={() => toggleTeacher(t)}
                  >
                    <View
                      style={[ss.colorIndicator, { backgroundColor: colorPalette[index % colorPalette.length] }]}
                    />
                    <Image style={ss.teacherAvatar} source={require("../../../Images/male.png")} />
                    <View style={ss.teacherInfo}>
                      <Text style={ss.tName}>{t.TeacherName?.toUpperCase()}</Text>
                      <Text style={ss.tRole}>{t.Designation || "Faculty Member"}</Text>
                    </View>
                    <View style={ss.selectionWrapper}>
                      <View style={[ss.checkbox, isSelected && ss.checkboxChecked]}>
                        {isSelected && <Text style={ss.tickText}>✓</Text>}
                      </View>
                      <Text style={ss.ratingText}>Avg: {t.AverageRating ?? "N/A"}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </>
      )}

      {selectedTeachers.length > 0 && (
        <>
          <Text style={ss.sectionTitle}>SELECT COMMON COURSES</Text>
          <View style={ss.scrollBox}>
            <ScrollView nestedScrollEnabled>
              {courses.map((c) => {
                const isCourseSelected = selectedCourses.includes(c.CourseID);
                return (
                  <TouchableOpacity
                    key={c.CourseID}
                    style={[ss.courseItem, isCourseSelected && ss.cardActive]}
                    onPress={() => toggleCourse(c.CourseID)}
                  >
                    <View style={[ss.checkbox, isCourseSelected && ss.checkboxChecked]}>
                      {isCourseSelected && <Text style={ss.tickText}>✓</Text>}
                    </View>
                    <View style={{ marginLeft: 10, flex: 1 }}>
                      <Text style={ss.courseCode}>{c.CourseID}</Text>
                      <Text style={ss.courseNameText}>{c.CourseName}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </>
      )}

      {selectedCourses.length > 0 && (
        <TouchableOpacity style={ss.showEvalBtn} onPress={fetchGradeData}>
          <Text style={ss.showEvalBtnText}>Show Grade Analysis</Text>
        </TouchableOpacity>
      )}

      {loading && <ActivityIndicator color="#28a745" size="large" style={{ marginTop: 20 }} />}

      {showResults && gradeData && (
        <View style={ss.graphCard}>
          <Text style={ss.graphHeader}>GRADE DISTRIBUTION COMPARISON</Text>
          <Text style={ss.selectedCourseLabel}>Courses: {selectedCourseLabel || "—"}</Text>
          <Text style={ss.hintText}>Har teacher ka alag chart (library sirf pehla dataset dikhati thi).</Text>
          {renderTeacherCharts()}
          <View style={ss.legendContainer}>
            {gradeData.map((t, i) => (
              <View key={`leg-${t.TeacherID ?? i}`} style={ss.legendItem}>
                <View style={[ss.legendDot, { backgroundColor: colorPalette[i % colorPalette.length] }]} />
                <Text style={ss.legendText}>{(t.TeacherName ?? "").split(" ")[0]}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <TouchableOpacity style={ss.homeBtn} onPress={() => navigation.goBack()}>
        <Text style={ss.homeBtnText}>⬅️ Back </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const ss = StyleSheet.create({
  main: { flexGrow: 1, backgroundColor: "#0d2e27", paddingHorizontal: 20, paddingBottom: 40 },
  topWrapper: { marginTop: 30 },
  logoContainer: { alignSelf: "center", backgroundColor: "#fff", borderRadius: 50, padding: 5 },
  logo: { width: 50, height: 50, resizeMode: "contain" },
  profileCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
  },
  profileInfo: { flex: 1 },
  pText: { color: "#444", fontSize: 11 },
  bold: { fontWeight: "bold", color: "#0d2e27" },
  pSubText: { color: "#28a745", fontWeight: "700", fontSize: 11 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  sectionTitle: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  pickerContainer: { backgroundColor: "#666363", borderRadius: 10, height: 50, justifyContent: "center" },
  picker: { width: "100%" },
  scrollBox: { height: 160, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 12, padding: 8 },
  teacherCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  cardActive: { backgroundColor: "#e8f5e9", borderWidth: 1, borderColor: "#28a745" },
  colorIndicator: { width: 5, height: "100%", borderRadius: 3, marginRight: 10 },
  teacherAvatar: { width: 35, height: 35, borderRadius: 17.5, marginRight: 10 },
  teacherInfo: { flex: 1 },
  tName: { fontSize: 11, fontWeight: "bold", color: "#333" },
  tRole: { fontSize: 9, color: "#666" },
  selectionWrapper: { alignItems: "flex-end" },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderColor: "#0d2e27",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: { backgroundColor: "#0d2e27" },
  tickText: { color: "#fff", fontSize: 10 },
  ratingText: { fontSize: 8, color: "#28a745", fontWeight: "bold", marginTop: 4 },
  courseItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  courseCode: { fontSize: 10, fontWeight: "bold", color: "#28a745" },
  courseNameText: { fontSize: 12, color: "#333" },
  graphCard: { backgroundColor: "#fff", borderRadius: 15, padding: 12, marginTop: 20 },
  graphHeader: { fontWeight: "bold", textAlign: "center", color: "#0d2e27", fontSize: 13 },
  selectedCourseLabel: { textAlign: "center", fontSize: 10, color: "#666", fontStyle: "italic", marginBottom: 6 },
  hintText: { textAlign: "center", fontSize: 9, color: "#888", marginBottom: 8 },
  chartsRow: { flexDirection: "row", alignItems: "flex-start", paddingVertical: 4, paddingRight: 8 },
  chartCard: {
    marginRight: 12,
    padding: 10,
    backgroundColor: "#fafafa",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },
  chartCardTitle: { fontSize: 11, fontWeight: "bold", color: "#0d2e27", textAlign: "center", marginBottom: 4 },
  legendContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 10,
  },
  legendItem: { flexDirection: "row", alignItems: "center", marginHorizontal: 8, marginBottom: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 5 },
  legendText: { fontSize: 10, color: "#444", fontWeight: "bold" },
  showEvalBtn: { backgroundColor: "#c91212", padding: 15, borderRadius: 10, alignItems: "center", marginTop: 20 },
  showEvalBtnText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  homeBtn: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 15,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  homeBtnText: { color: "#0d2e27", fontWeight: "bold", fontSize: 12 },
});

export default TeacherGradeDashboard;
