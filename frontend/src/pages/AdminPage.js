import { useState, useEffect, useContext } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  TrendingUp,
  LogOut,
  ChevronDown,
  ChevronRight,
  FileText,
  Target,
  RefreshCw,
  Key,
} from "lucide-react";
import { Button, message, Modal, Input, Form } from "antd";
import { useNavigate } from "react-router-dom";
import { Table, Alert, Spin } from "antd";
import AuthContext from "../context/AuthContext";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "https://rc-track.onrender.com";

const AdminPage = () => {
  const { user } = useContext(AuthContext);
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [expandedMenus, setExpandedMenus] = useState({});
  const [dashboardData, setDashboardData] = useState({
    rcStats: {
      totalRc: 0,
      totalRcTransferred: 0,
      totalRtoFeeDone: 0,
      totalRcTransferLeft: 0,
    },
    ownerName: user?.name || "",
  });
  const [loading, setLoading] = useState(true);
  const [isOwnerView, setIsOwnerView] = useState(false);
  const [error, setError] = useState(null);
  const [isChangePasswordModalVisible, setIsChangePasswordModalVisible] =
    useState(false);
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    if (activeMenu === "Dashboard") {
      fetchDashboardData();
    }
  }, [activeMenu, isOwnerView]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const endpoint = isOwnerView
        ? `${API_BASE_URL}/api/dashboard/owner`
        : `${API_BASE_URL}/api/dashboard`;

      const response = await fetch(endpoint, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const data = await response.json();
      const rcStats = await calculateRcStats();

      setDashboardData({
        ...data.data,
        rcStats: {
          totalRc: rcStats.totalRc,
          totalRcTransferred: rcStats.totalRcTransferred,
          totalRtoFeeDone: rcStats.totalRtoFeeDone,
          totalRcTransferLeft: rcStats.totalRcTransferLeft,
        },
        ownerName: user?.name || data.data?.ownerName || "",
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError("Failed to load dashboard data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };
  const handleChangePassword = async (values) => {
    try {
      setChangePasswordLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/users/change-password`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
          body: JSON.stringify({
            currentPassword: values.currentPassword,
            newPassword: values.newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to change password");
      }

      message.success("Password changed successfully");
      setIsChangePasswordModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error("Error changing password:", error);
      message.error(error.message || "Failed to change password");
    } finally {
      setChangePasswordLoading(false);
    }
  };

  const calculateRcStats = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/rc`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
    });

    if (!response.ok) throw new Error("Failed to fetch RC entries");

    const responseData = await response.json();
    const rcEntries = Array.isArray(responseData.data)
      ? responseData.data
      : [];

    return {
      totalRc: rcEntries.length,
      totalRcTransferred: rcEntries.filter(
        (entry) => entry.status === "transferred"
      ).length,
      totalRtoFeeDone: rcEntries.filter((entry) => entry.rtoFeesPaid === true) // Explicitly check for true
        .length,
      totalRcTransferLeft: rcEntries.filter(
        (entry) => entry.status !== "transferred"
      ).length,
    };
  } catch (error) {
    console.error("Error calculating RC stats:", error);
    return {
      totalRc: 0,
      totalRcTransferred: 0,
      totalRtoFeeDone: 0,
      totalRcTransferLeft: 0,
    };
  }
};

  const toggleOwnerView = () => {
    setIsOwnerView(!isOwnerView);
  };

  const toggleMenu = (menuName) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuName]: !prev[menuName],
    }));
  };

  const handleMenuClick = (menuName, path) => {
    setActiveMenu(menuName);
    navigate(path);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("authToken");
    sessionStorage.clear();
    navigate("/login");
  };

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
  const ChangePasswordButton = () => (
    <button
      onClick={() => setIsChangePasswordModalVisible(true)}
      style={{
        backgroundColor: "#8b5cf6",
        color: "white",
        border: "none",
        borderRadius: "6px",
        padding: "8px 16px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        cursor: "pointer",
        transition: "background-color 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "#7c3aed";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "#8b5cf6";
      }}
    >
      <Key size={16} />
      Change Password
    </button>
  );
  const ChangePasswordModal = () => (
    <Modal
      title="Change Password"
      visible={isChangePasswordModalVisible}
      onCancel={() => {
        setIsChangePasswordModalVisible(false);
        form.resetFields();
      }}
      footer={null}
      centered
    >
      <Form form={form} layout="vertical" onFinish={handleChangePassword}>
        <Form.Item
          name="currentPassword"
          label="Current Password"
          rules={[
            { required: true, message: "Please input your current password" },
          ]}
        >
          <Input.Password placeholder="Enter current password" />
        </Form.Item>

        <Form.Item
          name="newPassword"
          label="New Password"
          rules={[
            { required: true, message: "Please input your new password" },
            { min: 6, message: "Password must be at least 6 characters" },
          ]}
          hasFeedback
        >
          <Input.Password placeholder="Enter new password" />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label="Confirm New Password"
          dependencies={["newPassword"]}
          hasFeedback
          rules={[
            { required: true, message: "Please confirm your new password" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("newPassword") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(
                  new Error("The two passwords do not match")
                );
              },
            }),
          ]}
        >
          <Input.Password placeholder="Confirm new password" />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={changePasswordLoading}
            style={{ width: "100%" }}
          >
            Change Password
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );

  const DashboardCards = () => (
    <div style={styles.cardsGrid}>
      <div style={{ ...styles.card, borderLeft: "4px solid #3b82f6" }}>
        <div style={styles.cardContent}>
          <div>
            <p style={styles.cardLabel}>Total RC</p>
            <p style={styles.cardValue}>
              {dashboardData.rcStats?.totalRc || 0}
            </p>
          </div>
          <div style={{ ...styles.cardIcon, backgroundColor: "#dbeafe" }}>
            <FileText size={32} color="#2563eb" />
          </div>
        </div>
      </div>

      <div style={{ ...styles.card, borderLeft: "4px solid #10b981" }}>
        <div style={styles.cardContent}>
          <div>
            <p style={styles.cardLabel}>Total RC Transferred</p>
            <p style={styles.cardValue}>
              {dashboardData.rcStats?.totalRcTransferred || 0}
            </p>
          </div>
          <div style={{ ...styles.cardIcon, backgroundColor: "#d1fae5" }}>
            <TrendingUp size={32} color="#059669" />
          </div>
        </div>
      </div>

      <div style={{ ...styles.card, borderLeft: "4px solid #8b5cf6" }}>
        <div style={styles.cardContent}>
          <div>
            <p style={styles.cardLabel}>Total RTO Fee Done</p>
            <p style={styles.cardValue}>
              {dashboardData.rcStats?.totalRtoFeeDone || 0}
            </p>
          </div>
          <div style={{ ...styles.cardIcon, backgroundColor: "#ede9fe" }}>
            <ShoppingCart size={32} color="#7c3aed" />
          </div>
        </div>
      </div>

      <div style={{ ...styles.card, borderLeft: "4px solid #f59e0b" }}>
        <div style={styles.cardContent}>
          <div>
            <p style={styles.cardLabel}>Total RC Transfer Left</p>
            <p style={styles.cardValue}>
              {dashboardData.rcStats?.totalRcTransferLeft || 0}
            </p>
          </div>
          <div style={{ ...styles.cardIcon, backgroundColor: "#fef3c7" }}>
            <Target size={32} color="#d97706" />
          </div>
        </div>
      </div>
    </div>
  );

  const RcTransferStatusTable = () => {
    const [rcEntries, setRcEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
      const fetchRcEntries = async () => {
        try {
          setLoading(true);
          const response = await fetch(`${API_BASE_URL}/api/rc`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            },
          });

          if (!response.ok) throw new Error("Failed to fetch RC entries");

          const responseData = await response.json();
          // Filter to only show entries that aren't transferred
          const nonTransferredEntries = Array.isArray(responseData.data)
            ? responseData.data.filter(
                (entry) => entry.status !== "transferred"
              )
            : [];
          setRcEntries(nonTransferredEntries);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };

      fetchRcEntries();
    }, []);

    const calculateDaysOverdue = (createdAt) => {
      if (!createdAt) return 0;

      try {
        const createdDate = new Date(createdAt);
        const today = new Date();
        const diffTime = Math.abs(today - createdDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
      } catch (e) {
        console.error("Error calculating days overdue:", e);
        return 0;
      }
    };

    const getAlertLevel = (daysOverdue) => {
      if (daysOverdue > 30) return "critical";
      if (daysOverdue > 20) return "warning";
      return "normal";
    };

    const columns = [
      {
        title: "Vehicle Reg No.",
        dataIndex: "vehicleRegNo",
        key: "vehicleRegNo",
        render: (text) => (text ? text.toUpperCase() : "-"),
      },
      {
        title: "Vehicle Name",
        dataIndex: "vehicleName",
        key: "vehicleName",
        render: (text) => text || "-",
      },
      {
        title: "Owner Name",
        dataIndex: "ownerName",
        key: "ownerName",
        render: (text) => text || "-",
      },
      {
        title: "Applicant Name",
        dataIndex: "applicantName",
        key: "applicantName",
        render: (text) => text || "-",
      },
      {
        title: "Days Overdue",
        key: "daysOverdue",
        render: (_, record) => {
          const daysOverdue = calculateDaysOverdue(record.createdAt);
          return `${daysOverdue} day${daysOverdue !== 1 ? "s" : ""}`;
        },
      },
      {
        title: "Alert Status",
        key: "alertStatus",
        render: (_, record) => {
          const daysOverdue = calculateDaysOverdue(record.createdAt);
          const alertLevel = getAlertLevel(daysOverdue);

          if (alertLevel === "critical") {
            return (
              <Alert
                message={`Critical (${daysOverdue} days)`}
                description="Fine may apply - urgent action needed"
                type="error"
                showIcon
                style={{ padding: "4px 8px" }}
              />
            );
          } else if (alertLevel === "warning") {
            return (
              <Alert
                message={`Warning (${daysOverdue} days)`}
                description="Deadline approaching"
                type="warning"
                showIcon
                style={{ padding: "4px 8px" }}
              />
            );
          } else {
            return (
              <Alert
                message={`Normal (${daysOverdue} days)`}
                type="info"
                showIcon
                style={{ padding: "4px 8px" }}
              />
            );
          }
        },
      },
      {
        title: "Action",
        key: "action",
        render: (_, record) => (
          <Button
            type="primary"
            onClick={() => handleUpdateStatus(record._id)}
            style={{ whiteSpace: "nowrap" }}
          >
            Mark as Transferred
          </Button>
        ),
      },
    ];

    const handleUpdateStatus = async (id) => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/rc/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
          body: JSON.stringify({ status: "transferred" }),
        });

        if (!response.ok) throw new Error("Failed to update status");
        const updatedResponse = await fetch(`${API_BASE_URL}/api/rc`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        });
        const updatedData = await updatedResponse.json();
        const nonTransferredEntries = Array.isArray(updatedData.data)
          ? updatedData.data.filter((entry) => entry.status !== "transferred")
          : [];
        setRcEntries(nonTransferredEntries);

        message.success("Status updated successfully");
      } catch (error) {
        console.error("Error updating status:", error);
        message.error("Failed to update status");
      }
    };

    return (
      <div style={{ marginTop: "24px" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "16px" }}>
          Pending RC Transfers ({rcEntries.length})
        </h2>
        {error && (
          <Alert
            message={error}
            type="error"
            style={{ marginBottom: "16px" }}
          />
        )}
        <Table
          columns={columns}
          dataSource={rcEntries}
          loading={loading}
          rowKey="_id"
          bordered
          pagination={{ pageSize: 10 }}
          locale={{
            emptyText: "No pending RC transfers found",
          }}
        />
      </div>
    );
  };

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
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h1 style={styles.pageTitle}>Dashboard</h1>
                <p style={styles.pageSubtitle}>
                  {isOwnerView ? (
                    <>
                      Personal financial overview for{" "}
                      <strong>
                        {dashboardData.ownerName || user?.name || "User"}
                      </strong>
                    </>
                  ) : (
                    "Monitor your business performance and manage operations"
                  )}
                </p>
              </div>
              <div
                style={{ display: "flex", gap: "16px", alignItems: "center" }}
              >
                <ChangePasswordButton />
                <button
                  onClick={toggleOwnerView}
                  style={{
                    backgroundColor: isOwnerView ? "#10b981" : "#3b82f6",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    padding: "8px 16px",
                    cursor: "pointer",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = isOwnerView
                      ? "#059669"
                      : "#2563eb";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = isOwnerView
                      ? "#10b981"
                      : "#3b82f6";
                  }}
                >
                  {isOwnerView ? "Business View" : "Owner View"}
                </button>
                <button
                  onClick={fetchDashboardData}
                  style={{
                    backgroundColor: "#f59e0b",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    padding: "8px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#d97706";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#f59e0b";
                  }}
                >
                  <RefreshCw size={16} />
                  Refresh
                </button>
              </div>
            </div>
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
            <>
              {activeMenu === "Dashboard" && (
                <>
                  <DashboardCards />
                  <RcTransferStatusTable />
                </>
              )}

              {activeMenu !== "Dashboard" && (
                <div style={styles.placeholderCard}>
                  <h2 style={styles.placeholderTitle}>{activeMenu}</h2>
                  <p style={styles.placeholderText}>
                    This section is under development. Content for {activeMenu}{" "}
                    will be implemented here.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <ChangePasswordModal />
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
    marginBottom: "32px",
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
  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "24px",
    marginBottom: "32px",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow:
      "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    padding: "24px",
    transition: "transform 0.2s",
  },
  cardContent: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardLabel: {
    fontSize: "0.875rem",
    fontWeight: "500",
    color: "#6b7280",
    margin: 0,
  },
  cardValue: {
    fontSize: "1.875rem",
    fontWeight: "bold",
    color: "#1f2937",
    margin: "4px 0 0 0",
  },
  cardIcon: {
    padding: "12px",
    borderRadius: "50%",
  },
  placeholderCard: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow:
      "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    padding: "32px",
    textAlign: "center",
  },
  placeholderTitle: {
    fontSize: "1.5rem",
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: "16px",
    margin: "0 0 16px 0",
  },
  placeholderText: {
    color: "#6b7280",
    margin: 0,
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "300px",
  },
};

export default AdminPage;
