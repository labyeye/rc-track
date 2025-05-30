import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  ChevronLeft,
  Save,
  Upload,
  Download,
  Check,
  X,
} from "lucide-react";
import AuthContext from "../context/AuthContext";

const RcEntryPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [rcId, setRcId] = useState(null);

  const [formData, setFormData] = useState({
    vehicleName: "",
    vehicleRegNo: "",
    ownerName: "",
    ownerPhone: "",
    applicantName: "",
    applicantPhone: "",
    work: "",
    dealerName: "",
    rtoAgentName: "",
    remarks: "",
    status: {
      rcTransferred: false,
      rtoFeesPaid: false,
    },
  });

  useEffect(() => {
    // Check if we're editing an existing RC entry
    const pathParts = window.location.pathname.split("/");
    if (pathParts.includes("edit") && pathParts.length > 2) {
      const id = pathParts[pathParts.length - 1];
      setIsEditMode(true);
      setRcId(id);
      fetchRcEntry(id);
    }
  }, []);

  const fetchRcEntry = async (id) => {
    try {
      setLoading(true);
      const response = await fetch(`https://rc-track.onrender.com/api/rc/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });

      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = "Failed to fetch RC entry";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          // If response is not JSON, use status text
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setFormData(data.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching RC entry:", error);
      setError(error.message || "Failed to load RC entry. Please try again later.");
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "rcTransferred" || name === "rtoFeesPaid") {
      setFormData((prev) => ({
        ...prev,
        status: {
          ...prev.status,
          [name]: checked,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleFileChange = (e) => {
    setPdfFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let response;
      const payload = {
        ...formData,
        createdBy: user.id,
      };

      if (isEditMode) {
        response = await fetch(`https://rc-track.onrender.com/api/rc/${rcId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch("https://rc-track.onrender.com/api/rc", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        // Better error handling for non-JSON responses
        let errorMessage = `Server error: ${response.status} ${response.statusText}`;
        
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } else {
            // If response is HTML or other format, get text
            const errorText = await response.text();
            console.error("Server returned non-JSON response:", errorText);
            errorMessage = `Server error (${response.status}). Check console for details.`;
          }
        } catch (parseError) {
          console.error("Error parsing server response:", parseError);
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setSuccess("RC entry saved successfully!");

      // If we're creating a new entry, redirect to edit page with the new ID
      if (!isEditMode) {
        navigate(`/rclist`);
        setRcId(data.data._id);
        setIsEditMode(true);
      }

      // Upload PDF if file was selected
      if (pdfFile) {
        await uploadPdf(data.data._id);
      }
    } catch (error) {
      console.error("Error saving RC entry:", error);
      setError(error.message || "Failed to save RC entry. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const uploadPdf = async (id) => {
    if (!pdfFile) return;

    const formData = new FormData();
    formData.append("pdf", pdfFile);

    try {
      const response = await fetch(
        `https://rc-track.onrender.com/api/rc/${id}/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        let errorMessage = "Failed to upload PDF";
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          }
        } catch (parseError) {
          errorMessage = `Upload failed: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setFormData((prev) => ({
        ...prev,
        pdfUrl: data.data.pdfUrl,
      }));
      setPdfFile(null);
      setSuccess("PDF uploaded successfully!");
    } catch (error) {
      console.error("Error uploading PDF:", error);
      setError(error.message || "Failed to upload PDF. Please try again.");
    }
  };

  const downloadPdf = () => {
    if (!formData.pdfUrl) return;
    window.open(`https://rc-track.onrender.com${formData.pdfUrl}`, "_blank");
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.backButton}>
          <ChevronLeft size={20} />
          Back
        </button>
        <h1 style={styles.title}>
          <FileText size={24} style={styles.titleIcon} />
          {isEditMode ? "Edit RC Entry" : "Create New RC Entry"}
        </h1>
      </div>

      {error && (
        <div style={styles.alertError}>
          <X size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div style={styles.alertSuccess}>
          <Check size={18} />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGrid}>
          {/* Vehicle Details */}
          <div style={styles.formSection}>
            <h3 style={styles.sectionTitle}>Vehicle Details</h3>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Vehicle Name</label>
              <input
                type="text"
                name="vehicleName"
                value={formData.vehicleName}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Vehicle Registration No.</label>
              <input
                type="text"
                name="vehicleRegNo"
                value={formData.vehicleRegNo}
                onChange={handleChange}
                style={styles.input}
                required
                disabled={isEditMode}
              />
            </div>
          </div>

          {/* Owner Details */}
          <div style={styles.formSection}>
            <h3 style={styles.sectionTitle}>Owner Details</h3>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Owner Name</label>
              <input
                type="text"
                name="ownerName"
                value={formData.ownerName}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Owner Phone</label>
              <input
                type="tel"
                name="ownerPhone"
                value={formData.ownerPhone}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>
          </div>

          {/* Applicant Details */}
          <div style={styles.formSection}>
            <h3 style={styles.sectionTitle}>Applicant Details</h3>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Buyer Name</label>
              <input
                type="text"
                name="applicantName"
                value={formData.applicantName}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Buyer Phone</label>
              <input
                type="tel"
                name="applicantPhone"
                value={formData.applicantPhone}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>
          </div>

          {/* Work Details */}
          <div style={styles.formSection}>
            <h3 style={styles.sectionTitle}>Work Details</h3>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Work Description</label>
              <input
                type="text"
                name="work"
                value={formData.work}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Dealer Name</label>
              <input
                type="text"
                name="dealerName"
                value={formData.dealerName}
                onChange={handleChange}
                style={styles.input}
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>RTO Agent Name</label>
              <input
                type="text"
                name="rtoAgentName"
                value={formData.rtoAgentName}
                onChange={handleChange}
                style={styles.input}
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Remarks</label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                style={{ ...styles.input, minHeight: "80px" }}
              />
            </div>
          </div>

          {/* Status */}
          <div style={styles.formSection}>
            <h3 style={styles.sectionTitle}>Status</h3>
            <div style={styles.checkboxGroup}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="rcTransferred"
                  checked={formData.status.rcTransferred}
                  onChange={handleChange}
                  style={styles.checkbox}
                />
                RC Transferred
              </label>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="rtoFeesPaid"
                  checked={formData.status.rtoFeesPaid}
                  onChange={handleChange}
                  style={styles.checkbox}
                />
                RTO Fees Paid
              </label>
            </div>
          </div>
          <div style={styles.formSection}>
            <h3 style={styles.sectionTitle}>RC Document</h3>
            {formData.pdfUrl ? (
              <div style={styles.pdfContainer}>
                <p style={styles.pdfText}>PDF uploaded</p>
                <button
                  type="button"
                  onClick={downloadPdf}
                  style={styles.pdfButton}
                >
                  <Download size={16} />
                  Download PDF
                </button>
                <label style={styles.pdfUploadLabel}>
                  <Upload size={16} />
                  Replace PDF
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf"
                    style={{ display: "none" }}
                  />
                </label>
              </div>
            ) : (
              <div style={styles.pdfContainer}>
                <label style={styles.pdfUploadLabel}>
                  <Upload size={16} />
                  Upload RC PDF
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf"
                    style={{ display: "none" }}
                  />
                </label>
                <p style={styles.pdfHint}>Max 5MB, PDF only</p>
              </div>
            )}
            {pdfFile && (
              <p style={styles.pdfFileInfo}>
                Selected file: {pdfFile.name}
                <button
                  type="button"
                  onClick={() => uploadPdf(rcId)}
                  style={styles.uploadButton}
                  disabled={loading}
                >
                  {loading ? "Uploading..." : "Upload Now"}
                </button>
              </p>
            )}
          </div>
        </div>

        <div style={styles.formActions}>
          <button type="submit" style={styles.submitButton} disabled={loading}>
            {loading ? (
              "Saving..."
            ) : (
              <>
                <Save size={18} />
                {isEditMode ? "Update RC Entry" : "Create RC Entry"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

const styles = {
  container: {
    padding: "24px",
    backgroundColor: "#f3f4f6",
    minHeight: "100vh",
  },
  header: {
    display: "flex",
    alignItems: "center",
    marginBottom: "24px",
  },
  backButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "transparent",
    border: "none",
    color: "#3b82f6",
    cursor: "pointer",
    fontSize: "16px",
    marginRight: "20px",
    padding: "8px 12px",
    borderRadius: "6px",
    ":hover": {
      backgroundColor: "#e0e7ff",
    },
  },
  title: {
    fontSize: "24px",
    fontWeight: "600",
    color: "#1f2937",
    margin: 0,
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  titleIcon: {
    color: "#3b82f6",
  },
  alertError: {
    backgroundColor: "#fee2e2",
    color: "#dc2626",
    padding: "12px 16px",
    borderRadius: "6px",
    marginBottom: "20px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  alertSuccess: {
    backgroundColor: "#d1fae5",
    color: "#059669",
    padding: "12px 16px",
    borderRadius: "6px",
    marginBottom: "20px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  form: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "24px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "24px",
  },
  formSection: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1f2937",
    margin: "0 0 8px 0",
    paddingBottom: "8px",
    borderBottom: "1px solid #e5e7eb",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#4b5563",
  },
  input: {
    padding: "10px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "14px",
    ":focus": {
      outline: "none",
      borderColor: "#3b82f6",
      boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.2)",
    },
  },
  checkboxGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
    color: "#4b5563",
    cursor: "pointer",
  },
  checkbox: {
    width: "16px",
    height: "16px",
    accentColor: "#3b82f6",
  },
  pdfContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  pdfText: {
    fontSize: "14px",
    color: "#4b5563",
    margin: 0,
  },
  pdfButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "#e0e7ff",
    color: "#3b82f6",
    border: "none",
    borderRadius: "6px",
    padding: "8px 12px",
    fontSize: "14px",
    cursor: "pointer",
    width: "fit-content",
    ":hover": {
      backgroundColor: "#c7d2fe",
    },
  },
  pdfUploadLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "#e0e7ff",
    color: "#3b82f6",
    border: "none",
    borderRadius: "6px",
    padding: "8px 12px",
    fontSize: "14px",
    cursor: "pointer",
    width: "fit-content",
    ":hover": {
      backgroundColor: "#c7d2fe",
    },
  },
  pdfHint: {
    fontSize: "12px",
    color: "#6b7280",
    margin: 0,
  },
  pdfFileInfo: {
    fontSize: "14px",
    color: "#4b5563",
    margin: "8px 0 0 0",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  uploadButton: {
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "4px",
    padding: "4px 8px",
    fontSize: "12px",
    cursor: "pointer",
    ":hover": {
      backgroundColor: "#2563eb",
    },
  },
  formActions: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "24px",
  },
  submitButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "6px",
    padding: "10px 20px",
    fontSize: "16px",
    fontWeight: "500",
    cursor: "pointer",
    ":hover": {
      backgroundColor: "#2563eb",
    },
    ":disabled": {
      backgroundColor: "#93c5fd",
      cursor: "not-allowed",
    },
  },
};

export default RcEntryPage;