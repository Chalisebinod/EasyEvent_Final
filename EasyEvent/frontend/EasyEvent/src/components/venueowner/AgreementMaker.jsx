import React, { useState, useEffect } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import {
  Box,
  Button,
  Typography,
  Divider,
  Paper,
  Tab,
  Tabs,
  IconButton,
  Container,
  Alert,
} from "@mui/material";
import { Delete as DeleteIcon, Star as StarIcon, Edit as EditIcon } from "@mui/icons-material";
import VenueSidebar from "./VenueSidebar";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AgreementMaker = () => {
  // --------------------------------------------------------------------------
  // STATE
  // --------------------------------------------------------------------------
  const [tabValue, setTabValue] = useState(0); // 0=Terms, 1=Rules, 2=Cancellation
  const [templates, setTemplates] = useState({
    terms: [],
    rules: [],
    cancellation: []
  });
  
  // For creating a new template, we only store the "content"
  // The title is auto-set based on the current tab.
  const [newTemplateContent, setNewTemplateContent] = useState("");

  // For editing an existing template:
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [editContent, setEditContent] = useState("");

  // --------------------------------------------------------------------------
  // EFFECTS
  // --------------------------------------------------------------------------
  useEffect(() => {
    fetchTemplates();
  }, []);

  // --------------------------------------------------------------------------
  // HELPER FUNCTIONS
  // --------------------------------------------------------------------------
  const getVenueId = () => localStorage.getItem("venueId");
  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
  });

  // Get the display label based on the tab index
  const getTemplateTypeLabel = (index) => {
    const labels = {
      0: "Terms & Conditions",
      1: "Venue Rules",
      2: "Cancellation Policy",
    };
    return labels[index];
  };

  // Back-end type strings
  const typeMap = ["terms", "rules", "cancellation"];

  // --------------------------------------------------------------------------
  // API CALLS
  // --------------------------------------------------------------------------
  const fetchTemplates = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8000/api/booking/templates/${getVenueId()}`,
        getAuthHeaders()
      );

      if (response.data.success) {
        const sorted = {
          terms: response.data.templates.filter((t) => t.type === "terms"),
          rules: response.data.templates.filter((t) => t.type === "rules"),
          cancellation: response.data.templates.filter((t) => t.type === "cancellation"),
        };
        setTemplates(sorted);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast.error("Failed to fetch templates");
    }
  };

  const handleCreateTemplate = async () => {
    try {
      const templateType = typeMap[tabValue]; // "terms", "rules", or "cancellation"
      const response = await axios.post(
        "http://localhost:8000/api/booking/templates",
        {
          title: getTemplateTypeLabel(tabValue), // auto-set the title
          content: newTemplateContent,
          type: templateType,
          venue: getVenueId(),
        },
        getAuthHeaders()
      );

      if (response.data.success) {
        toast.success("Template created successfully");
        // Clear the new content field so that you see the existing templates immediately.
        setNewTemplateContent("");
        // (Auto-advance has been removed so that after creating each policy, the list is visible.)
        fetchTemplates();
      }
    } catch (error) {
      console.error("Error creating template:", error);
      toast.error("Failed to create template");
    }
  };

  const startEditing = (template) => {
    setEditingTemplate(template);
    setEditContent(template.content);
  };

  const cancelEditing = () => {
    setEditingTemplate(null);
    setEditContent("");
  };

  const handleEditTemplate = async () => {
    if (!editingTemplate) return;
    try {
      const response = await axios.put(
        `http://localhost:8000/api/booking/templates/${editingTemplate._id}`,
        {
          // Keep the original title
          title: editingTemplate.title,
          content: editContent,
        },
        getAuthHeaders()
      );

      if (response.data.success) {
        toast.success("Template updated successfully");
        setEditingTemplate(null);
        setEditContent("");
        fetchTemplates();
      }
    } catch (error) {
      console.error("Error updating template:", error);
      toast.error("Failed to update template");
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    try {
      const currentType = typeMap[tabValue];
      const templateToDelete = templates[currentType].find((t) => t._id === templateId);
      if (templateToDelete?.isDefault) {
        toast.warning("Please set another template as default before deleting this one.");
        return;
      }

      const response = await axios.delete(
        `http://localhost:8000/api/booking/templates/${templateId}`,
        getAuthHeaders()
      );

      if (response.data.success) {
        toast.success(response.data.message);
        fetchTemplates();
      }
    } catch (error) {
      console.error("Error deleting template:", error);
      const errorMessage = error.response?.data?.message || "Failed to delete template";
      toast.error(errorMessage);
    }
  };

  const isDeleteDisabled = (template) => {
    const currentType = typeMap[tabValue];
    const templatesInType = templates[currentType] || [];
    return templatesInType.length <= 1 || template.isDefault;
  };

  const handleSetDefaultTemplate = async (templateId) => {
    try {
      const response = await axios.put(
        `http://localhost:8000/api/booking/templates/${templateId}/set-default`,
        {},
        getAuthHeaders()
      );

      if (response.data.success) {
        toast.success("Default template updated");
        fetchTemplates();
      }
    } catch (error) {
      console.error("Error setting default template:", error);
      toast.error("Failed to set default template");
    }
  };

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------
  return (
    <div className="min-h-screen flex bg-gray-100">
      <VenueSidebar />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom>
            Agreement Templates
          </Typography>
          <Alert severity="info" sx={{ mb: 3 }}>
            Create and manage templates for your venue's terms, rules, and cancellation policies.
            These templates can be reused when creating agreements.
          </Alert>

          <Tabs
            value={tabValue}
            onChange={(e, newValue) => {
              setTabValue(newValue);
              // Clear the new content area whenever we switch tabs.
              setNewTemplateContent("");
              // Also cancel any editing in progress.
              cancelEditing();
            }}
            sx={{ mb: 3 }}
          >
            <Tab label="Terms & Conditions" />
            <Tab label="Venue Rules" />
            <Tab label="Cancellation Policy" />
          </Tabs>

          {/* CREATE / EDIT TEMPLATE SECTION */}
          {!editingTemplate ? (
            // ------------------ CREATE NEW TEMPLATE ------------------
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Create New {getTemplateTypeLabel(tabValue)} Template
              </Typography>
              {/* The title is auto-set – we only take the content */}
              <ReactQuill
                value={newTemplateContent}
                onChange={(content) => setNewTemplateContent(content)}
                style={{ height: "200px", marginBottom: "50px" }}
              />
              <Button
                variant="contained"
                onClick={handleCreateTemplate}
                disabled={!newTemplateContent}
                sx={{ mt: 2 }}
              >
                Create Template
              </Button>
            </Box>
          ) : (
            // ------------------ EDIT EXISTING TEMPLATE ------------------
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Editing: {editingTemplate.title}
              </Typography>
              <ReactQuill
                value={editContent}
                onChange={(content) => setEditContent(content)}
                style={{ height: "200px", marginBottom: "50px" }}
              />
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleEditTemplate}
                  disabled={!editContent}
                  sx={{ mr: 2 }}
                >
                  Save Changes
                </Button>
                <Button variant="outlined" onClick={cancelEditing}>
                  Cancel
                </Button>
              </Box>
            </Box>
          )}

          <Divider sx={{ my: 4 }} />

          {/* LIST EXISTING TEMPLATES */}
          <Typography variant="h6" gutterBottom>
            Existing {getTemplateTypeLabel(tabValue)} Templates
          </Typography>

          {templates[typeMap[tabValue]]?.length === 0 && (
            <Alert severity="info">
              No templates found. Create your first {getTemplateTypeLabel(tabValue).toLowerCase()} template.
            </Alert>
          )}

          {templates[typeMap[tabValue]]?.map((template) => (
            <Paper key={template._id} sx={{ p: 3, mb: 2, bgcolor: "grey.50" }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" color={template.isDefault ? "primary" : "textPrimary"}>
                  {template.title} {template.isDefault && "(Default)"}
                </Typography>
                <Box>
                  <IconButton
                    onClick={() => startEditing(template)}
                    color="primary"
                    title="Edit Template"
                    sx={{ mr: 1 }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleSetDefaultTemplate(template._id)}
                    color={template.isDefault ? "primary" : "default"}
                    title={template.isDefault ? "Default Template" : "Set as Default"}
                    sx={{ mr: 1 }}
                  >
                    <StarIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDeleteTemplate(template._id)}
                    color="error"
                    disabled={isDeleteDisabled(template)}
                    title={
                      template.isDefault
                        ? "Cannot delete default template"
                        : templates[typeMap[tabValue]].length <= 1
                        ? "Cannot delete the only template"
                        : "Delete Template"
                    }
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Box>
              <div
                dangerouslySetInnerHTML={{ __html: template.content }}
                style={{
                  backgroundColor: "white",
                  padding: "16px",
                  borderRadius: "4px",
                  border: "1px solid #e0e0e0"
                }}
              />
            </Paper>
          ))}
        </Paper>
      </Container>
    </div>
  );
};

export default AgreementMaker;
