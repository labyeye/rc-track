import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  Edit,
  Trash2,
  Search,
  ChevronDown,
  ChevronRight,
  Download,
  LogOut,
} from "lucide-react";
import {
  Input,
  Table,
  Spin,
  Alert,
  Form,
  Button,
  Modal,
  Select,
  message,
  Checkbox,
} from "antd";
import AuthContext from "../context/AuthContext";
import { ShoppingCart, LayoutDashboard, TrendingUp } from "lucide-react";
import * as XLSX from "xlsx";
const { Option } = Select;
const { TextArea } = Input;

const RcListPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rcEntries, setRcEntries] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [activeMenu, setActiveMenu] = useState("RC Status");
  const [expandedMenus, setExpandedMenus] = useState({});
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [form] = Form.useForm();
  const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL || "http://localhost:2500";

  const menuItems = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      path: "/admin",
    },
    {
      name: "RC Entry",
      icon: ShoppingCart,
      path: "/rcentry",
    },
    {
      name: "RC Status",
      icon: TrendingUp,
      path: "/rclist",
    },
  ];

  useEffect(() => {
    const fetchRcEntries = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/rc`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch RC entries");
        }

        const data = await response.json();
        setRcEntries(data.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching RC entries:", error);
        setError("Failed to load RC entries. Please try again later.");
        setLoading(false);
      }
    };

    fetchRcEntries();
  }, []);

  const handleMenuClick = (menuName, path) => {
    setActiveMenu(menuName);
    navigate(path);
  };

  const handleExportExcel = () => {
    const exportData = rcEntries.map((entry) => ({
      "Vehicle Reg No.": entry.vehicleRegNo || "-",
      "Vehicle Name": entry.vehicleName || "-",
      "Owner Name": entry.ownerName || "-",
      "Applicant Name": entry.applicantName || "-",
      Work: entry.work || "-",
      "Dealer Name": entry.dealerName || "-",
      "RTO Agent Name": entry.rtoAgentName || "-",
      "RC Transferred": entry.status?.rcTransferred ? "Yes" : "No",
      "RTO Fees Paid": entry.status?.rtoFeesPaid ? "Yes" : "No",
      "Created At": new Date(entry.createdAt).toLocaleString(),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "RC Entries");
    XLSX.writeFile(
      wb,
      `RC_Entries_${new Date().toISOString().split("T")[0]}.xlsx`
    );
  };

  const toggleMenu = (menuName) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuName]: !prev[menuName],
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("authToken");
    sessionStorage.clear();
    navigate("/login");
  };

  const filteredEntries = rcEntries.filter((entry) => {
    const searchLower = searchText.toLowerCase();
    return (
      (entry.vehicleRegNo &&
        entry.vehicleRegNo.toLowerCase().includes(searchLower)) ||
      (entry.vehicleName &&
        entry.vehicleName.toLowerCase().includes(searchLower)) ||
      (entry.ownerName &&
        entry.ownerName.toLowerCase().includes(searchLower)) ||
      (entry.applicantName &&
        entry.applicantName.toLowerCase().includes(searchLower)) ||
      (entry.dealerName &&
        entry.dealerName.toLowerCase().includes(searchLower)) ||
      (entry.rtoAgentName &&
        entry.rtoAgentName.toLowerCase().includes(searchLower))
    );
  });

  const handleDownload = (pdfUrl) => {
    if (!pdfUrl) return;
    window.open(`${API_BASE_URL}${pdfUrl}`, "_blank");
  };

  const handleEdit = (record) => {
    setCurrentRecord(record);
    form.setFieldsValue({
      vehicleRegNo: record.vehicleRegNo,
      vehicleName: record.vehicleName,
      ownerName: record.ownerName,
      applicantName: record.applicantName,
      work: record.work,
      dealerName: record.dealerName,
      rtoAgentName: record.rtoAgentName,
      rcTransferred: Boolean(record.status?.rcTransferred),
      rtoFeesPaid: Boolean(record.status?.rtoFeesPaid),
    });
    setIsEditModalVisible(true);
  };
  const handleUpdate = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Structure the data to match schema
      const updateData = {
        vehicleRegNo: values.vehicleRegNo,
        vehicleName: values.vehicleName,
        ownerName: values.ownerName,
        applicantName: values.applicantName,
        work: values.work,
        dealerName: values.dealerName,
        rtoAgentName: values.rtoAgentName,
        status: {
          rcTransferred: Boolean(values.rcTransferred),
          rtoFeesPaid: Boolean(values.rtoFeesPaid),
        },
      };

      const response = await fetch(
        `${API_BASE_URL}/api/rc/${currentRecord._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update RC entry");
      }

      const updatedData = await response.json();
      setRcEntries((prevEntries) =>
        prevEntries.map((entry) =>
          entry._id === currentRecord._id ? updatedData.data : entry
        )
      );
      setIsEditModalVisible(false);
      setCurrentRecord(null);
      form.resetFields();
      setLoading(false);
    } catch (error) {
      console.error("Error updating RC entry:", error);
      setError("Failed to update RC entry. Please try again.");
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
  if (!window.confirm("Are you sure you want to delete this RC entry?")) {
    return;
  }

  try {
    setLoading(true);
    
    const response = await fetch(`${API_BASE_URL}/api/rc/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        'Content-Type': 'application/json'
      },
    });

    // Check if response is ok
    if (!response.ok) {
      let errorMessage = "Failed to delete RC entry";
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (parseError) {
        // If JSON parsing fails, use status-based error message
        switch (response.status) {
          case 404:
            errorMessage = "RC entry not found";
            break;
          case 403:
            errorMessage = "Not authorized to delete this RC entry";
            break;
          case 401:
            errorMessage = "Authentication required. Please login again.";
            // Redirect to login if unauthorized
            localStorage.removeItem("token");
            navigate("/login");
            return;
          default:
            errorMessage = `Delete failed with status: ${response.status}`;
        }
      }
      
      throw new Error(errorMessage);
    }

    // Parse successful response
    const result = await response.json();
    
    if (result.success) {
      // Success - update state and show message
      setRcEntries((prev) => prev.filter((entry) => entry._id !== id));
      message.success("RC entry deleted successfully");
    } else {
      throw new Error(result.message || "Delete operation failed");
    }

  } catch (error) {
    console.error("Error deleting RC entry:", error);
    
    // Show user-friendly error message
    if (error.message.includes("fetch")) {
      message.error("Network error. Please check your connection and try again.");
    } else {
      message.error(error.message || "Failed to delete RC entry");
    }
    
    // Set error state for UI feedback
    setError(error.message || "Failed to delete RC entry");
  } finally {
    setLoading(false);
  }
};

// Also add this error boundary component at the top of your file for better error handling
const ErrorBoundary = ({ children, fallback }) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleError = (error) => {
      setHasError(true);
      setError(error);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return fallback || <div>Something went wrong: {error?.message}</div>;
  }

  return children;
};

  const columns = [
    {
      title: "Vehicle Reg No.",
      dataIndex: "vehicleRegNo",
      key: "vehicleRegNo",
      render: (text) => text || "-",
      sorter: (a, b) =>
        (a.vehicleRegNo || "").localeCompare(b.vehicleRegNo || ""),
    },
    {
      title: "Vehicle Name",
      dataIndex: "vehicleName",
      key: "vehicleName",
      render: (text) => text || "-",
      sorter: (a, b) =>
        (a.vehicleName || "").localeCompare(b.vehicleName || ""),
    },
    {
      title: "Owner Name",
      dataIndex: "ownerName",
      key: "ownerName",
      render: (text) => text || "-",
      sorter: (a, b) => (a.ownerName || "").localeCompare(b.ownerName || ""),
    },
    {
      title: "Applicant Name",
      dataIndex: "applicantName",
      key: "applicantName",
      render: (text) => text || "-",
      sorter: (a, b) =>
        (a.applicantName || "").localeCompare(b.applicantName || ""),
    },
    {
      title: "Work",
      dataIndex: "work",
      key: "work",
      render: (text) => text || "-",
    },
    {
      title: "Dealer Name",
      dataIndex: "dealerName",
      key: "dealerName",
      render: (text) => text || "-",
      sorter: (a, b) => (a.dealerName || "").localeCompare(b.dealerName || ""), // Fixed this line
    },
    {
      title: "RTO Agent Name",
      dataIndex: "rtoAgentName",
      key: "rtoAgentName",
      render: (text) => text || "-",
      sorter: (a, b) =>
        (a.rtoAgentName || "").localeCompare(b.rtoAgentName || ""),
    },
    {
      title: "Status",
      key: "status",
      render: (_, record) => (
        <div style={styles.statusContainer}>
          <span
            style={
              record.status?.rcTransferred
                ? styles.statusActive
                : styles.statusInactive
            }
          >
            RC Transferred: {record.status?.rcTransferred ? "Yes" : "No"}
          </span>
          <span
            style={
              record.status?.rtoFeesPaid
                ? styles.statusActive
                : styles.statusInactive
            }
          >
            RTO Fees Paid: {record.status?.rtoFeesPaid ? "Yes" : "No"}
          </span>
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <div style={styles.actionsContainer}>
          <button
            onClick={() => handleEdit(record)}
            style={styles.actionButton}
            title="Edit"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={() => handleDelete(record._id)}
            style={{ ...styles.actionButton, color: "#ef4444" }}
            title="Delete"
            disabled={loading}
          >
            {loading ? <Spin size="small" /> : <Trash2 size={18} />}
          </button>
        </div>
      ),
    },
  ];

  const EditModal = () => (
    <Modal
      title="Edit RC Entry"
      visible={isEditModalVisible}
      onCancel={() => setIsEditModalVisible(false)}
      footer={[
        <Button key="back" onClick={() => setIsEditModalVisible(false)}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleUpdate}
        >
          Save Changes
        </Button>,
      ]}
      width={800}
    >
      <Form form={form} layout="vertical">
        <div style={{ display: "flex", gap: "16px" }}>
          <div style={{ flex: 1 }}>
            <Form.Item name="vehicleRegNo" label="Vehicle Registration No">
              <Input placeholder="Enter vehicle registration number" />
            </Form.Item>

            <Form.Item name="vehicleName" label="Vehicle Name">
              <Input placeholder="Enter vehicle name" />
            </Form.Item>

            <Form.Item name="ownerName" label="Owner Name">
              <Input placeholder="Enter owner name" />
            </Form.Item>

            <Form.Item name="applicantName" label="Applicant Name">
              <Input placeholder="Enter applicant name" />
            </Form.Item>
          </div>

          <div style={{ flex: 1 }}>
            <Form.Item name="work" label="Work Description">
              <TextArea rows={3} placeholder="Enter work description" />
            </Form.Item>

            <Form.Item name="dealerName" label="Dealer Name">
              <Input placeholder="Enter dealer name" />
            </Form.Item>

            <Form.Item name="rtoAgentName" label="RTO Agent Name">
              <Input placeholder="Enter RTO agent name" />
            </Form.Item>

            <Form.Item name="status" label="Status">
              <Select placeholder="Select status">
                <Option value="pending">Pending</Option>
                <Option value="transferred">Transferred</Option>
                <Option value="completed">Completed</Option>
              </Select>
            </Form.Item>

            <Form.Item name="rcTransferred" valuePropName="checked">
              <Checkbox>RC Transferred</Checkbox>
            </Form.Item>

            <Form.Item name="rtoFeesPaid" valuePropName="checked">
              <Checkbox>RTO Fees Paid</Checkbox>
            </Form.Item>
          </div>
        </div>
      </Form>
    </Modal>
  );

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <p style={styles.sidebarSubtitle}>Welcome, {user?.name || "User"}</p>
        </div>

        <nav style={styles.nav}>
          {menuItems.map((item) => (
            <div key={item.name}>
              <div
                style={{
                  ...styles.menuItem,
                  ...(activeMenu === item.name ? styles.menuItemActive : {}),
                }}
                onClick={() => {
                  if (item.submenu) {
                    toggleMenu(item.name);
                  } else {
                    handleMenuClick(item.name, item.path);
                  }
                }}
              >
                <div style={styles.menuItemContent}>
                  <item.icon size={20} style={styles.menuIcon} />
                  <span style={styles.menuText}>{item.name}</span>
                </div>
                {item.submenu &&
                  (expandedMenus[item.name] ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  ))}
              </div>

              {item.submenu && expandedMenus[item.name] && (
                <div style={styles.submenu}>
                  {item.submenu.map((subItem) => (
                    <div
                      key={subItem.name}
                      style={styles.submenuItem}
                      onClick={() =>
                        handleMenuClick(subItem.name, subItem.path)
                      }
                    >
                      {subItem.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div style={styles.logoutButton} onClick={handleLogout}>
            <LogOut size={20} style={styles.menuIcon} />
            <span style={styles.menuText}>Logout</span>
          </div>
        </nav>
      </div>

      <div style={styles.mainContent}>
        <div style={styles.contentPadding}>
          <div style={styles.header}>
            <h1 style={styles.pageTitle}>RC Entries List</h1>
            <p style={styles.pageSubtitle}>View and manage all RC entries</p>
          </div>

          <div style={styles.searchContainer}>
            <Input
              placeholder="Search by vehicle number, name, etc..."
              prefix={<Search size={16} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={styles.searchInput}
              allowClear
            />
            <Button
              type="primary"
              onClick={handleExportExcel}
              style={{ marginLeft: "16px" }}
              icon={<Download size={16} />}
            >
              Export to Excel
            </Button>
          </div>

          {loading ? (
            <div style={styles.loadingContainer}>
              <Spin size="large" />
            </div>
          ) : error ? (
            <Alert
              message="Error"
              description={error}
              type="error"
              showIcon
              style={{ marginBottom: "24px" }}
            />
          ) : (
            <Table
              columns={columns}
              dataSource={filteredEntries}
              rowKey="_id"
              bordered
              pagination={{ pageSize: 10 }}
              style={styles.table}
              locale={{
                emptyText: "No RC entries found",
              }}
            />
          )}
        </div>
        {isEditModalVisible && <EditModal />}
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    height: "100vh",
    backgroundColor: "#f3f4f6",
    fontFamily: "Arial, sans-serif",
  },
  sidebar: {
    width: "280px",
    backgroundColor: "#1e293b",
    color: "#f8fafc",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    position: "sticky",
    top: 0,
    height: "100vh",
    backgroundImage: "linear-gradient(to bottom, #1e293b, #0f172a)",
  },
  sidebarHeader: {
    padding: "24px",
    borderBottom: "1px solid #334155",
  },
  sidebarTitle: {
    fontSize: "1.25rem",
    fontWeight: "600",
    color: "#ffffff",
    margin: 0,
  },
  sidebarSubtitle: {
    fontSize: "0.875rem",
    color: "#94a3b8",
    margin: "4px 0 0 0",
  },
  nav: {
    padding: "16px 0",
  },
  menuItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 24px",
    cursor: "pointer",
    color: "#e2e8f0",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  },
  menuItemActive: {
    backgroundColor: "#334155",
    borderRight: "3px solid #3b82f6",
    color: "#ffffff",
  },
  menuItemContent: {
    display: "flex",
    alignItems: "center",
  },
  menuIcon: {
    marginRight: "12px",
    color: "#94a3b8",
  },
  menuText: {
    fontSize: "0.9375rem",
    fontWeight: "500",
  },
  submenu: {
    backgroundColor: "#1a2536",
  },
  submenuItem: {
    padding: "10px 24px 10px 64px",
    cursor: "pointer",
    color: "#cbd5e1",
    fontSize: "0.875rem",
    transition: "all 0.2s ease",
  },
  logoutButton: {
    display: "flex",
    alignItems: "center",
    padding: "12px 24px",
    cursor: "pointer",
    color: "#f87171",
    marginTop: "16px",
    borderTop: "1px solid #334155",
    transition: "all 0.2s ease",
  },
  mainContent: {
    flex: 1,
    overflow: "auto",
  },
  contentPadding: {
    padding: "32px",
  },
  header: {
    marginBottom: "24px",
  },
  pageTitle: {
    fontSize: "1.875rem",
    fontWeight: "bold",
    color: "#1f2937",
    margin: 0,
  },
  pageSubtitle: {
    color: "#6b7280",
    marginTop: "8px",
    margin: "8px 0 0 0",
  },
  searchContainer: {
    marginBottom: "24px",
  },
  searchInput: {
    maxWidth: "400px",
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "300px",
  },
  table: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    overflow: "hidden",
  },
  statusContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  statusActive: {
    color: "#059669",
    fontSize: "12px",
    backgroundColor: "#d1fae5",
    padding: "4px 8px",
    borderRadius: "4px",
    display: "inline-block",
  },
  statusInactive: {
    color: "#6b7280",
    fontSize: "12px",
    backgroundColor: "#f3f4f6",
    padding: "4px 8px",
    borderRadius: "4px",
    display: "inline-block",
  },
  actionsContainer: {
    display: "flex",
    gap: "8px",
  },
  actionButton: {
    backgroundColor: "transparent",
    border: "none",
    color: "#3b82f6",
    cursor: "pointer",
    padding: "4px",
    borderRadius: "4px",
    ":hover": {
      backgroundColor: "#e0e7ff",
    },
    ":disabled": {
      color: "#9ca3af",
      cursor: "not-allowed",
      ":hover": {
        backgroundColor: "transparent",
      },
    },
  },
};

export default RcListPage;
