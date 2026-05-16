import API from "./axios.custom";

// Get user's target settings
export const getTargetAPI = async (idUser) => {
  try {
    const response = await API.get(`/statistics/get-target/${idUser}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching target:", error);
    throw error;
  }
};

// Update user's target settings
export const updateTargetAPI = async (idUser, data) => {
  try {
    const response = await API.patch(`/statistics/target/${idUser}`, data);
    return response.data;
  } catch (error) {
    console.error("Error updating target:", error);
    throw error;
  }
};

// Get user's overall score/band
export const getOverallScoreAPI = async (idUser) => {
  try {
    const response = await API.get(`/statistics/overall-score/${idUser}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching overall score:", error);
    throw error;
  }
};

// Study Planner Algorithm - Calculate realistic target
export const calculateStudyPlanAPI = async (planData) => {
  try {
    const response = await API.post("/study-planner/calculate", planData);
    return response.data;
  } catch (error) {
    console.error("Error calculating study plan:", error);
    throw error;
  }
};

// Get user's personalized study plan
export const getStudyPlanAPI = async (idUser) => {
  try {
    const response = await API.get("/study-planner/plan", {
      params: { idUser },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching study plan:", error);
    throw error;
  }
};

// Get weekly plan
export const getWeeklyPlanAPI = async (idUser) => {
  try {
    const response = await API.get(`/study-planner/weekly/${idUser}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching weekly plan:", error);
    throw error;
  }
};

// Generate daily study tasks
export const getDailyTasksAPI = async (idUser, date) => {
  try {
    const response = await API.get("/study-planner/daily", {
      params: { idUser, date },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching daily tasks:", error);
    throw error;
  }
};

// Submit milestone completion
export const submitMilestoneAPI = async (idUser, milestoneData) => {
  try {
    const response = await API.post("/study-planner/milestone", {
      idUser,
      ...milestoneData,
    });
    return response.data;
  } catch (error) {
    console.error("Error submitting milestone:", error);
    throw error;
  }
};

// Complete a daily task
export const completeTaskAPI = async (taskId, completed) => {
  try {
    const response = await API.patch(`/study-planner/daily-tasks/${taskId}/complete`, { completed });
    return response.data;
  } catch (error) {
    console.error("Error completing task:", error);
    throw error;
  }
};