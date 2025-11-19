"use client";
import React, { useMemo, useState } from "react";
import { AlertTriangle, Clock, Download, Eye, FileText, Filter, Plus, Search, Share2, Trash2 } from "lucide-react";

type DocumentRow = {
  id: string;
  user_id: string;
  title?: string | null;
  description?: string | null;
  file_name: string;
  file_size?: number | null;
  file_type?: string | null;
  document_type?: string | null;
  status?: string | null;
  expiry_date?: string | null;
  tags?: string[] | null;
  created_at?: string | null;
  approved_date?: string | null;
  approved_by?: string | null;
  file_url?: string | null;
};

function formatFileSize(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return "-";
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

function formatDate(dateString?: string | null): string {
  if (!dateString) return "-";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "-";
  }
}

function isExpiringSoon(expiryDate?: string | null): boolean {
  if (!expiryDate) return false;
  const expiry = new Date(expiryDate);
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  return expiry <= thirtyDaysFromNow;
}

function StatusBadge({ status }: { status?: string | null }) {
  const normalized = (status || "").toLowerCase();
  const colorClasses =
    normalized === "approved"
      ? "bg-green-600/20 text-green-400 border border-green-500/30"
      : normalized === "pending"
        ? "bg-yellow-600/20 text-yellow-400 border border-yellow-500/30"
        : normalized === "rejected" || normalized === "expired"
          ? "bg-red-600/20 text-red-400 border border-red-500/30"
          : "bg-gray-600/20 text-gray-400 border border-gray-500/30";
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${colorClasses}`}>
      {status || "-"}
    </span>
  );
}

function Modal({ isOpen, onClose, title, size = "md", children }: { isOpen: boolean; onClose: () => void; title: string; size?: "sm" | "md" | "lg"; children: React.ReactNode; }) {
  if (!isOpen) return null;
  const maxWidth = size === "lg" ? "max-w-3xl" : size === "sm" ? "max-w-md" : "max-w-xl";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative dark-card border border-white/20 w-full ${maxWidth} mx-4 rounded-xl shadow-2xl`}>
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">✕</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export default function DashboardClient({ docs }: { docs: DocumentRow[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | "all">("all");
  const [selectedDocument, setSelectedDocument] = useState<DocumentRow | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [documentToShare, setDocumentToShare] = useState<DocumentRow | null>(null);
  const [shareExpiry, setShareExpiry] = useState("7d");
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<DocumentRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const stats = useMemo(() => {
    const total = docs.length;
    const approved = docs.filter((d) => (d.status || "").toLowerCase() === "approved").length;
    const pending = docs.filter((d) => (d.status || "").toLowerCase() === "pending").length;
    const expiringSoon = docs.filter((d) => isExpiringSoon(d.expiry_date)).length;
    return { total, approved, pending, expiringSoon };
  }, [docs]);

  const filteredDocuments = useMemo(() => {
    return docs.filter((doc) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch = !q
        ? true
        : (doc.title || doc.file_name || "").toLowerCase().includes(q) ||
        (doc.tags || []).some((t) => (t || "").toLowerCase().includes(q));
      const matchesStatus = statusFilter === "all" || (doc.status || "").toLowerCase() === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [docs, searchQuery, statusFilter]);

  const handleShareDocument = (document: DocumentRow) => {
    setDocumentToShare(document);
    setShowShareModal(true);
    setShareLink(null);
    setShareError(null);
    setShareExpiry("7d");
  };

  const handleCloseShareModal = () => {
    setShowShareModal(false);
    setDocumentToShare(null);
    setShareLink(null);
    setShareError(null);
    setIsGeneratingLink(false);
  };

  const handleGenerateLink = async () => {
    if (!documentToShare) return;

    setIsGeneratingLink(true);
    setShareError(null);

    try {
      // Convert expiry selection to minutes
      const expiryMinutes = {
        "24h": 24 * 60,
        "7d": 7 * 24 * 60,
        "30d": 30 * 24 * 60
      }[shareExpiry] || 7 * 24 * 60;

      const response = await fetch('/api/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_id: documentToShare.id,
          expires_in_minutes: expiryMinutes
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate share link');
      }

      setShareLink(result.url);
    } catch (error) {
      setShareError(error instanceof Error ? error.message : 'Failed to generate share link');
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const handleDeleteDocument = (document: DocumentRow) => {
    setDocumentToDelete(document);
    setShowDeleteModal(true);
    setDeleteError(null);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setDocumentToDelete(null);
    setDeleteError(null);
    setIsDeleting(false);
  };

  const handleConfirmDelete = async () => {
    if (!documentToDelete) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch('/api/documents', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_id: documentToDelete.id
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete document');
      }

      // Refresh the page to update the document list
      window.location.reload();
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Failed to delete document');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Document Dashboard</h1>
        <p className="text-gray-300">Manage and track all your important documents in one place.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="dark-card p-6 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-200">
          <div className="flex items-center">
            <div className="bg-blue-600/20 p-3 rounded-lg border border-blue-500/30">
              <FileText className="h-6 w-6 text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Total Documents</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="dark-card p-6 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-200">
          <div className="flex items-center">
            <div className="bg-green-600/20 p-3 rounded-lg border border-green-500/30">
              <FileText className="h-6 w-6 text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Approved</p>
              <p className="text-2xl font-bold text-white">{stats.approved}</p>
            </div>
          </div>
        </div>

        <div className="dark-card p-6 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-200">
          <div className="flex items-center">
            <div className="bg-yellow-600/20 p-3 rounded-lg border border-yellow-500/30">
              <Clock className="h-6 w-6 text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-white">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="dark-card p-6 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-200">
          <div className="flex items-center">
            <div className="bg-red-600/20 p-3 rounded-lg border border-red-500/30">
              <AlertTriangle className="h-6 w-6 text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Expiring Soon</p>
              <p className="text-2xl font-bold text-white">{stats.expiringSoon}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="dark-card p-6 rounded-xl border border-white/10 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-white/20 rounded-lg bg-white/5 text-white placeholder-white/50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white/10 transition-all duration-200 outline-none"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="pl-10 pr-8 py-3 border border-white/20 rounded-lg bg-white/5 text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white/10 transition-all duration-200 outline-none"
              >
                <option value="all" className="bg-gray-800">All Status</option>
                <option value="approved" className="bg-gray-800">Approved</option>
                <option value="pending" className="bg-gray-800">Pending</option>
                <option value="rejected" className="bg-gray-800">Rejected</option>
                <option value="expired" className="bg-gray-800">Expired</option>
              </select>
            </div>
          </div>

          <a
            href="/upload"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2 shadow-lg"
          >
            <Plus className="h-5 w-5" />
            <span>Upload Document</span>
          </a>
        </div>
      </div>

      <div className="dark-card rounded-xl border border-white/10 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">Recent Documents</h2>
        </div>

        {filteredDocuments.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No documents found</h3>
            <p className="text-gray-400 mb-6">
              {searchQuery || statusFilter !== "all" ? "Try adjusting your search or filters" : "Upload your first document to get started"}
            </p>
            <a href="/upload" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 shadow-lg">Upload Document</a>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Document</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Expiry Date</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Upload Date</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredDocuments.map((document) => (
                  <tr key={document.id} className="hover:bg-white/5 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-blue-400" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white">{document.title || document.file_name}</div>
                          <div className="text-sm text-gray-400">{formatFileSize(document.file_size ?? null)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-600/20 text-gray-400 border border-gray-500/30 capitalize">
                        {document.document_type || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={document.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {document.expiry_date ? (
                        <div className="flex items-center">
                          <span className="text-sm text-white">{formatDate(document.expiry_date)}</span>
                          {isExpiringSoon(document.expiry_date) && <AlertTriangle className="h-4 w-4 text-red-400 ml-2" />}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">No expiry</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{formatDate(document.created_at)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-3">
                        <button onClick={() => setSelectedDocument(document)} className="text-blue-400 hover:text-blue-300 transition-colors duration-200" title="View Details">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleShareDocument(document)} className="text-green-400 hover:text-green-300 transition-colors duration-200" title="Share Document">
                          <Share2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDeleteDocument(document)} className="text-red-400 hover:text-red-300 transition-colors duration-200" title="Delete Document">
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <a className="text-gray-400 hover:text-gray-300 transition-colors duration-200" href={document.file_url || undefined} download target="_blank" rel="noreferrer" title="Download File">
                          <Download className="h-4 w-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={!!selectedDocument} onClose={() => setSelectedDocument(null)} title="Document Details" size="lg">
        {selectedDocument && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Title</label>
                <p className="text-sm text-white">{selectedDocument.title || selectedDocument.file_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Type</label>
                <p className="text-sm text-white capitalize">{selectedDocument.document_type || "-"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Status</label>
                <StatusBadge status={selectedDocument.status} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">File Size</label>
                <p className="text-sm text-white">{formatFileSize(selectedDocument.file_size)}</p>
              </div>
            </div>
            {selectedDocument.description && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                <p className="text-sm text-white">{selectedDocument.description}</p>
              </div>
            )}
            {selectedDocument.tags && selectedDocument.tags.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {selectedDocument.tags.map((tag, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-600/20 text-blue-400 border border-blue-500/30 text-xs rounded-full">{tag}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal isOpen={showShareModal} onClose={handleCloseShareModal} title="Share Document">
        <div className="space-y-4">
          <p className="text-sm text-gray-400">Create a secure, time-limited link to share this document.</p>

          {documentToShare && (
            <div className="p-3 bg-white/5 rounded-lg border border-white/10">
              <p className="text-sm font-medium text-gray-400">Document:</p>
              <p className="text-sm text-white">{documentToShare.title || documentToShare.file_name}</p>
            </div>
          )}

          {!shareLink ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Link expires in</label>
                <select
                  value={shareExpiry}
                  onChange={(e) => setShareExpiry(e.target.value)}
                  className="w-full p-3 border border-white/20 rounded-lg bg-white/5 text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                >
                  <option value="24h" className="bg-gray-800">24 hours</option>
                  <option value="7d" className="bg-gray-800">7 days</option>
                  <option value="30d" className="bg-gray-800">30 days</option>
                </select>
              </div>

              {shareError && (
                <div className="p-3 bg-red-600/20 border border-red-500/30 rounded-lg">
                  <p className="text-sm text-red-400">{shareError}</p>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={handleGenerateLink}
                  disabled={isGeneratingLink || !documentToShare}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white px-4 py-3 rounded-lg font-medium transition-colors duration-200"
                >
                  {isGeneratingLink ? 'Generating...' : 'Generate Link'}
                </button>
                <button onClick={handleCloseShareModal} className="flex-1 bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-lg font-medium transition-colors duration-200">Cancel</button>
              </div>
            </>
          ) : (
            <>
              <div className="p-3 bg-green-600/20 border border-green-500/30 rounded-lg">
                <p className="text-sm font-medium text-green-400 mb-2">Share link generated successfully!</p>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={shareLink}
                    readOnly
                    className="flex-1 p-2 text-sm border border-white/20 rounded bg-white/5 text-white"
                  />
                  <button
                    onClick={() => copyToClipboard(shareLink)}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors duration-200"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="text-sm text-gray-400">
                <p>This link will expire in {shareExpiry === '24h' ? '24 hours' : shareExpiry === '7d' ? '7 days' : '30 days'}.</p>
                <p className="mt-1">Anyone with this link can access the document until it expires.</p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShareLink(null);
                    setShareError(null);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors duration-200"
                >
                  Generate Another Link
                </button>
                <button onClick={handleCloseShareModal} className="flex-1 bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-lg font-medium transition-colors duration-200">Close</button>
              </div>
            </>
          )}
        </div>
      </Modal>

      <Modal isOpen={showDeleteModal} onClose={handleCloseDeleteModal} title="Delete Document">
        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-3 bg-red-600/20 border border-red-500/30 rounded-lg">
            <Trash2 className="h-5 w-5 text-red-400" />
            <div>
              <p className="text-sm font-medium text-red-400">Are you sure you want to delete this document?</p>
              <p className="text-sm text-gray-400">This action cannot be undone.</p>
            </div>
          </div>

          {documentToDelete && (
            <div className="p-3 bg-white/5 rounded-lg border border-white/10">
              <p className="text-sm font-medium text-gray-400">Document:</p>
              <p className="text-sm text-white">{documentToDelete.title || documentToDelete.file_name}</p>
              <p className="text-sm text-gray-400">Type: {documentToDelete.document_type || 'Unknown'}</p>
            </div>
          )}

          {deleteError && (
            <div className="p-3 bg-red-600/20 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-400">{deleteError}</p>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={handleConfirmDelete}
              disabled={isDeleting || !documentToDelete}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white px-4 py-3 rounded-lg font-medium transition-colors duration-200"
            >
              {isDeleting ? 'Deleting...' : 'Delete Document'}
            </button>
            <button onClick={handleCloseDeleteModal} className="flex-1 bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-lg font-medium transition-colors duration-200">Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}


