import React, { useEffect, useState } from "react";

function Packages() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    sessions: "3",
    pricePerSession: "",
    expiryDays: "30",
  });

  const token = localStorage.getItem("token");

  const fetchPackages = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/packages/my",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setPackages(data.packages);
      }
    } catch (error) {
      console.error("Failed to load packages:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setForm({
      name: "",
      sessions: "3",
      pricePerSession: "",
      expiryDays: "30",
    });

    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !form.name ||
      !form.sessions ||
      !form.pricePerSession ||
      !form.expiryDays
    ) {
      alert("Please fill all package details.");
      return;
    }

    try {
      setSaving(true);

      const url = editingId
        ? `http://localhost:5000/api/packages/${editingId}`
        : "http://localhost:5000/api/packages";

      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name,
          sessions: Number(form.sessions),
          pricePerSession: Number(form.pricePerSession),
          expiryDays: Number(form.expiryDays),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(data.message || "Failed to save package.");
        return;
      }

      alert(
        editingId
          ? "Package updated successfully."
          : "Package created successfully."
      );

      resetForm();
      fetchPackages();
    } catch (error) {
      console.error("Save package error:", error);
      alert("Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (packageItem) => {
    setEditingId(packageItem._id);

    setForm({
      name: packageItem.name,
      sessions: String(packageItem.sessions),
      pricePerSession: String(packageItem.pricePerSession),
      expiryDays: String(packageItem.expiryDays),
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleToggle = async (packageItem) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/packages/${packageItem._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            isActive: !packageItem.isActive,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(data.message || "Failed to update package.");
        return;
      }

      fetchPackages();
    } catch (error) {
      console.error("Toggle package error:", error);
    }
  };

  const handleDelete = async (packageId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this package?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/packages/${packageId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(data.message || "Failed to delete package.");
        return;
      }

      fetchPackages();
    } catch (error) {
      console.error("Delete package error:", error);
    }
  };

  return (
    <div className="packages-page">
      <div className="packages-header">
        <div>
          <h1>Packages</h1>
          <p>
            Create session packages for your clients and manage
            their availability.
          </p>
        </div>
      </div>

      <div className="package-form-card">
        <div className="section-heading">
          <h2>
            {editingId ? "Edit Package" : "Create Package"}
          </h2>

          {editingId && (
            <button
              type="button"
              className="cancel-edit-btn"
              onClick={resetForm}
            >
              Cancel
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Package Name</label>

              <input
                type="text"
                name="name"
                placeholder="e.g. Wellness Package"
                value={form.name}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Sessions</label>

              <select
                name="sessions"
                value={form.sessions}
                onChange={handleChange}
              >
                <option value="3">3 Sessions</option>
                <option value="6">6 Sessions</option>
                <option value="12">12 Sessions</option>
              </select>
            </div>

            <div className="form-group">
              <label>Price Per Session (₹)</label>

              <input
                type="number"
                name="pricePerSession"
                min="0"
                placeholder="500"
                value={form.pricePerSession}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Expiry (Days)</label>

              <input
                type="number"
                name="expiryDays"
                min="1"
                placeholder="30"
                value={form.expiryDays}
                onChange={handleChange}
              />
            </div>
          </div>

          {form.pricePerSession && form.sessions && (
            <div className="package-total">
              <span>Total Package Price</span>

              <strong>
                ₹
                {(
                  Number(form.pricePerSession) *
                  Number(form.sessions)
                ).toLocaleString("en-IN")}
              </strong>
            </div>
          )}

          <button
            type="submit"
            className="save-package-btn"
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : editingId
              ? "Update Package"
              : "Create Package"}
          </button>
        </form>
      </div>

      <div className="packages-list-section">
        <div className="section-heading">
          <div>
            <h2>Your Packages</h2>
            <p>
              Packages available for your clients.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="packages-empty">
            Loading packages...
          </div>
        ) : packages.length === 0 ? (
          <div className="packages-empty">
            <h3>No packages yet</h3>
            <p>
              Create your first package using the form above.
            </p>
          </div>
        ) : (
          <div className="packages-grid">
            {packages.map((packageItem) => (
              <div
                className={`package-card ${
                  !packageItem.isActive
                    ? "package-inactive"
                    : ""
                }`}
                key={packageItem._id}
              >
                <div className="package-card-top">
                  <div>
                    <span className="package-sessions">
                      {packageItem.sessions} Sessions
                    </span>

                    <h3>{packageItem.name}</h3>
                  </div>

                  <span
                    className={`package-status ${
                      packageItem.isActive
                        ? "active"
                        : "inactive"
                    }`}
                  >
                    {packageItem.isActive
                      ? "Active"
                      : "Inactive"}
                  </span>
                </div>

                <div className="package-price">
                  <strong>
                    ₹
                    {packageItem.totalPrice.toLocaleString(
                      "en-IN"
                    )}
                  </strong>

                  <span>
                    ₹
                    {packageItem.pricePerSession.toLocaleString(
                      "en-IN"
                    )}{" "}
                    / session
                  </span>
                </div>

                <div className="package-details">
                  <div>
                    <span>Sessions</span>
                    <strong>
                      {packageItem.sessions}
                    </strong>
                  </div>

                  <div>
                    <span>Expiry</span>
                    <strong>
                      {packageItem.expiryDays} days
                    </strong>
                  </div>
                </div>

                <div className="package-actions">
                  <button
                    type="button"
                    onClick={() =>
                      handleEdit(packageItem)
                    }
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleToggle(packageItem)
                    }
                  >
                    {packageItem.isActive
                      ? "Deactivate"
                      : "Activate"}
                  </button>

                  <button
                    type="button"
                    className="delete-btn"
                    onClick={() =>
                      handleDelete(packageItem._id)
                    }
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .packages-page {
          padding: 30px;
          max-width: 1200px;
          margin: 0 auto;
          color: #203d35;
        }

        .packages-header {
          margin-bottom: 25px;
        }

        .packages-header h1 {
          margin: 0 0 6px;
          font-size: 30px;
        }

        .packages-header p,
        .section-heading p {
          margin: 0;
          color: #71807a;
          font-size: 14px;
        }

        .package-form-card {
          background: #ffffff;
          border: 1px solid #dfeae3;
          border-radius: 18px;
          padding: 24px;
          margin-bottom: 35px;
        }

        .section-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .section-heading h2 {
          margin: 0 0 5px;
          font-size: 20px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 18px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .form-group label {
          font-size: 13px;
          font-weight: 600;
        }

        .form-group input,
        .form-group select {
          height: 44px;
          padding: 0 13px;
          border: 1px solid #d5e1db;
          border-radius: 10px;
          background: #f9fbf9;
          color: #203d35;
          outline: none;
          font-size: 14px;
        }

        .form-group input:focus,
        .form-group select:focus {
          border-color: #315f51;
        }

        .package-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 20px;
          padding: 14px 16px;
          background: #f1f7f3;
          border-radius: 10px;
        }

        .package-total span {
          font-size: 14px;
          color: #5f7069;
        }

        .package-total strong {
          font-size: 20px;
          color: #315f51;
        }

        .save-package-btn {
          margin-top: 20px;
          padding: 12px 22px;
          border: none;
          border-radius: 10px;
          background: #315f51;
          color: white;
          font-weight: 600;
          cursor: pointer;
        }

        .save-package-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .cancel-edit-btn {
          border: 1px solid #d5e1db;
          background: white;
          color: #315f51;
          padding: 8px 14px;
          border-radius: 8px;
          cursor: pointer;
        }

        .packages-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
        }

        .package-card {
          background: white;
          border: 1px solid #dfeae3;
          border-radius: 18px;
          padding: 21px;
        }

        .package-card.package-inactive {
          opacity: 0.65;
        }

        .package-card-top {
          display: flex;
          justify-content: space-between;
          gap: 12px;
        }

        .package-sessions {
          display: inline-block;
          font-size: 11px;
          font-weight: 700;
          color: #315f51;
          background: #dfeae3;
          padding: 5px 9px;
          border-radius: 20px;
        }

        .package-card h3 {
          margin: 11px 0 0;
          font-size: 18px;
        }

        .package-status {
          height: fit-content;
          padding: 5px 9px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
        }

        .package-status.active {
          background: #e2f1e8;
          color: #28704c;
        }

        .package-status.inactive {
          background: #eeeeee;
          color: #777777;
        }

        .package-price {
          margin: 25px 0 20px;
        }

        .package-price strong {
          display: block;
          font-size: 27px;
          color: #203d35;
        }

        .package-price span {
          color: #71807a;
          font-size: 12px;
        }

        .package-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          border-top: 1px solid #edf2ef;
          border-bottom: 1px solid #edf2ef;
          padding: 14px 0;
          gap: 10px;
        }

        .package-details div {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .package-details span {
          font-size: 11px;
          color: #7b8983;
        }

        .package-details strong {
          font-size: 14px;
        }

        .package-actions {
          display: flex;
          gap: 7px;
          margin-top: 17px;
        }

        .package-actions button {
          flex: 1;
          border: 1px solid #d5e1db;
          background: white;
          color: #315f51;
          padding: 8px 5px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
        }

        .package-actions button:hover {
          background: #f1f7f3;
        }

        .package-actions .delete-btn {
          color: #a34b4b;
          border-color: #ead5d5;
        }

        .packages-empty {
          background: white;
          border: 1px dashed #cbdad2;
          border-radius: 16px;
          padding: 45px 20px;
          text-align: center;
        }

        .packages-empty h3 {
          margin: 0 0 7px;
        }

        .packages-empty p {
          margin: 0;
          color: #71807a;
          font-size: 14px;
        }

        @media (max-width: 900px) {
          .packages-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 650px) {
          .packages-page {
            padding: 20px;
          }

          .form-grid,
          .packages-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default Packages;