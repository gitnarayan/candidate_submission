"use client";

import { useRef, useState } from "react";

const createEmptyAddress = () => ({
  street1: "",
  street2: "",
});

const createEmptyDocument = () => ({
  id:
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  fileName: "",
  fileType: "image",
  file: null,
});

const createInitialForm = () => ({
  firstName: "",
  lastName: "",
  email: "",
  dob: "",
  sameAsResidential: true,
  residentialAddress: createEmptyAddress(),
  permanentAddress: createEmptyAddress(),
  documents: [createEmptyDocument(), createEmptyDocument()],
});

function detectDocumentType(file) {
  if (!file) {
    return null;
  }

  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();

  if (
    type === "application/pdf" ||
    name.endsWith(".pdf")
  ) {
    return "pdf";
  }

  return "image";
}

function getDocumentAccept(fileType) {
  if (fileType === "pdf") {
    return ".pdf,application/pdf";
  }

  return "image/*,.png,.jpg,.jpeg,.webp";
}

function getAgeFromDate(dateValue) {
  const birthDate = new Date(dateValue);

  if (Number.isNaN(birthDate.getTime())) {
    return 0;
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }

  return age;
}

export default function CandidateForm() {
  const [form, setForm] = useState(createInitialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputsRef = useRef([]);

  const updateField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateAddressField = (section, field, value) => {
    setForm((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const updateDocumentField = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      documents: prev.documents.map((document, currentIndex) =>
        currentIndex === index ? { ...document, [field]: value } : document
      ),
    }));
  };

  const handleDocumentFileChange = (index, event) => {
    const file = event.target.files?.[0] ?? null;

    setForm((prev) => {
      const nextDocuments = prev.documents.map((document, currentIndex) => {
        if (currentIndex !== index) {
          return document;
        }

        const detectedType = detectDocumentType(file) ?? document.fileType;
        const nextFileName =
          document.fileName.trim() || file?.name.replace(/\.[^.]+$/, "") || "";

        return {
          ...document,
          file,
          fileType: detectedType,
          fileName: nextFileName,
        };
      });

      return {
        ...prev,
        documents: nextDocuments,
      };
    });
  };

  const addDocumentRow = () => {
    setForm((prev) => ({
      ...prev,
      documents: [...prev.documents, createEmptyDocument()],
    }));
  };

  const removeDocumentRow = (index) => {
    setForm((prev) => {
      if (prev.documents.length <= 2) {
        return prev;
      }

      const nextDocuments = prev.documents.filter(
        (_, currentIndex) => currentIndex !== index
      );

      return {
        ...prev,
        documents: nextDocuments,
      };
    });
  };

  const validateForm = () => {
    const errors = {};

    if (!form.firstName.trim()) errors.firstName = "First name is required.";
    if (!form.lastName.trim()) errors.lastName = "Last name is required.";
    if (!form.email.trim()) errors.email = "Email is required.";
    if (!form.dob.trim()) {
      errors.dob = "Date of birth is required.";
    } else if (getAgeFromDate(form.dob) < 18) {
      errors.dob = "Age must be 18+.";
    }

    if (!form.residentialAddress.street1.trim()) {
      errors.residentialStreet1 = "Street 1 is required.";
    }
    if (!form.residentialAddress.street2.trim()) {
      errors.residentialStreet2 = "Street 2 is required.";
    }

    if (!form.sameAsResidential) {
      if (!form.permanentAddress.street1.trim()) {
        errors.permanentStreet1 = "Street 1 is required.";
      }
      if (!form.permanentAddress.street2.trim()) {
        errors.permanentStreet2 = "Street 2 is required.";
      }
    }

    if (form.documents.length < 2) {
      errors.documents = "Please add at least two documents.";
    }

    form.documents.forEach((document, index) => {
      if (!document.fileName.trim()) {
        errors[`documentName-${index}`] = "File name is required.";
      }

      if (!document.file) {
        errors[`documentFile-${index}`] = "Please upload a file.";
      }

      if (document.file) {
        const detectedType = detectDocumentType(document.file);

        if (document.fileType === "pdf" && detectedType !== "pdf") {
          errors[`documentFile-${index}`] = "Upload a PDF file.";
        }

        if (document.fileType === "image" && detectedType !== "image") {
          errors[`documentFile-${index}`] = "Upload an image file.";
        }
      }
    });

    return errors;
  };

  const resetForm = () => {
    setForm(createInitialForm());
    setFieldErrors({});
    setSubmitError("");
    setSuccess("");
    fileInputsRef.current.forEach((input) => {
      if (input) {
        input.value = "";
      }
    });
    fileInputsRef.current = [];
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFieldErrors({});
    setSubmitError("");
    setSuccess("");

    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return;
    }

    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      dob: form.dob,
      sameAsResidential: form.sameAsResidential,
      residentialAddress: {
        street1: form.residentialAddress.street1.trim(),
        street2: form.residentialAddress.street2.trim(),
      },
      permanentAddress: form.sameAsResidential
        ? {
            street1: form.residentialAddress.street1.trim(),
            street2: form.residentialAddress.street2.trim(),
          }
        : {
            street1: form.permanentAddress.street1.trim(),
            street2: form.permanentAddress.street2.trim(),
          },
      documents: form.documents.map((document) => ({
        fileName: document.fileName.trim(),
        fileType: document.fileType,
      })),
    };

    const formData = new FormData();
    formData.append("data", JSON.stringify(payload));

    for (const document of form.documents) {
      formData.append("documents", document.file);
    }

    try {
      setIsSubmitting(true);

      const response = await fetch("/api/candidate/create", {
        method: "POST",
        body: formData,
      });

      const contentType = response.headers.get("content-type") || "";
      const responseBody = contentType.includes("application/json")
        ? await response.json()
        : { message: await response.text() };

      if (!response.ok) {
        throw new Error(responseBody?.message || "Submission failed.");
      }

      setSuccess(responseBody?.message || "Submitted successfully.");
      resetForm();
    } catch (submitError) {
      setSubmitError(
        submitError instanceof Error
          ? submitError.message
          : "Submission failed. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-6 md:py-12">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
        <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-6 py-5 md:px-8">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
             
            </p>
            <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">
              Candidate Document Form
            </h1>
            <p className="max-w-2xl text-sm text-slate-600">
             
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 md:px-8 md:py-8">
          {submitError ? (
            <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {submitError}
            </div>
          ) : null}

          {success ? (
            <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </div>
          ) : null}

          <div className="grid gap-5 md:grid-cols-2">
              <Field
                label="First Name"
                required
                value={form.firstName}
                onChange={(value) => updateField("firstName", value)}
                placeholder="Enter your first name here.."
                error={fieldErrors.firstName}
              />
              <Field
                label="Last Name"
                required
                value={form.lastName}
                onChange={(value) => updateField("lastName", value)}
                placeholder="Enter your last name here.."
                error={fieldErrors.lastName}
              />
              <Field
                label="E-mail"
                required
                type="email"
                value={form.email}
                onChange={(value) => updateField("email", value)}
                placeholder="ex: myname@example.com"
                error={fieldErrors.email}
              />
              <Field
                label="Date of Birth"
                required
                type="date"
                value={form.dob}
                onChange={(value) => updateField("dob", value)}
                helperText="(Min. age should be 18 Years)"
                error={fieldErrors.dob}
              />
          </div>

          <section className="mt-8">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Residential Address
              </h2>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <Field
                label="Street 1"
                required
                value={form.residentialAddress.street1}
                onChange={(value) =>
                  updateAddressField("residentialAddress", "street1", value)
                }
                error={fieldErrors.residentialStreet1}
              />
              <Field
                label="Street 2"
                required
                value={form.residentialAddress.street2}
                onChange={(value) =>
                  updateAddressField("residentialAddress", "street2", value)
                }
                error={fieldErrors.residentialStreet2}
              />
            </div>
          </section>

          <div className="mt-6 flex items-center gap-3">
            <input
              id="sameAsResidential"
              type="checkbox"
              checked={form.sameAsResidential}
              onChange={(event) =>
                updateField("sameAsResidential", event.target.checked)
              }
              className="h-5 w-5 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
            />
            <label
              htmlFor="sameAsResidential"
              className="text-sm font-medium text-slate-800"
            >
              Same as Residential Address
            </label>
          </div>

          <section className="mt-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Permanent Address
              </h2>
              {form.sameAsResidential ? (
                <p className="mt-1 text-sm text-slate-500">
                  This will be copied from the residential address.
                </p>
              ) : null}
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <Field
                label="Street 1"
                required={!form.sameAsResidential}
                value={form.permanentAddress.street1}
                onChange={(value) =>
                  updateAddressField("permanentAddress", "street1", value)
                }
                error={fieldErrors.permanentStreet1}
              />
              <Field
                label="Street 2"
                required={!form.sameAsResidential}
                value={form.permanentAddress.street2}
                onChange={(value) =>
                  updateAddressField("permanentAddress", "street2", value)
                }
                error={fieldErrors.permanentStreet2}
              />
            </div>
          </section>

          <section className="mt-8">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Upload Documents
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Add at least two documents. The order should match the file
                type selected for each row.
              </p>
            </div>

            <div className="space-y-5">
              {fieldErrors.documents ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {fieldErrors.documents}
                </div>
              ) : null}

              {form.documents.map((document, index) => {
                const isLastRow = index === form.documents.length - 1;

                return (
                  <div
                    key={document.id}
                    className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 md:grid-cols-[1.1fr_0.9fr_1.2fr_auto]"
                  >
                    <Field
                      label="File Name"
                      required
                      value={document.fileName}
                      onChange={(value) =>
                        updateDocumentField(index, "fileName", value)
                      }
                      placeholder="Enter file name"
                      error={fieldErrors[`documentName-${index}`]}
                    />

                    <SelectField
                      label="Type of File"
                      required
                      value={document.fileType}
                      onChange={(value) =>
                        updateDocumentField(index, "fileType", value)
                      }
                      options={[
                        { label: "Image", value: "image" },
                        { label: "PDF", value: "pdf" },
                      ]}
                      helperText="(image, pdf.)"
                    />

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        Upload Document<span className="text-rose-500">*</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => fileInputsRef.current[index]?.click()}
                        className="flex h-11 w-full items-center justify-between rounded-xl border border-slate-300 bg-white px-3 text-left text-sm text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
                      >
                        <span className="truncate">
                          {document.file?.name || "Choose file"}
                        </span>
                        <span className="ml-3 inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-slate-600">
                          ^
                        </span>
                      </button>

                      <input
                        ref={(node) => {
                          fileInputsRef.current[index] = node;
                        }}
                        type="file"
                        accept={getDocumentAccept(document.fileType)}
                        className="hidden"
                        onChange={(event) => handleDocumentFileChange(index, event)}
                      />
                      {fieldErrors[`documentFile-${index}`] ? (
                        <p className="text-xs font-medium text-rose-600">
                          {fieldErrors[`documentFile-${index}`]}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex items-end">
                      {isLastRow ? (
                        <button
                          type="button"
                          onClick={addDocumentRow}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-900 bg-slate-900 text-xl font-semibold text-white transition hover:bg-slate-800"
                          aria-label="Add document row"
                        >
                          +
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => removeDocumentRow(index)}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300 bg-white text-xl font-semibold text-slate-600 transition hover:border-rose-300 hover:text-rose-600"
                          aria-label="Remove document row"
                        >
                          -
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <div className="mt-10 flex justify-center">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex min-w-56 items-center justify-center rounded-2xl bg-slate-900 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  required = false,
  value,
  onChange,
  type = "text",
  placeholder = "",
  helperText = "",
  error = "",
}) {
  const inputClasses =
    "mt-1 h-11 w-full rounded-xl border bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:ring-2";

  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="text-rose-500">*</span> : null}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`${inputClasses} ${
          error
            ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
            : "border-slate-300 focus:border-slate-400 focus:ring-slate-200"
        }`}
      />
      {error ? (
        <span className="mt-2 block text-xs font-medium text-rose-600">
          {error}
        </span>
      ) : null}
      {helperText ? (
        <span className="mt-2 block text-xs text-slate-500">{helperText}</span>
      ) : null}
    </label>
  );
}

function SelectField({
  label,
  required = false,
  value,
  onChange,
  options,
  helperText = "",
  error = "",
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="text-rose-500">*</span> : null}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`mt-1 h-11 w-full rounded-xl border bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:ring-2 ${
          error
            ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
            : "border-slate-300 focus:border-slate-400 focus:ring-slate-200"
        }`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? (
        <span className="mt-2 block text-xs font-medium text-rose-600">
          {error}
        </span>
      ) : null}
      {helperText ? (
        <span className="mt-2 block text-xs text-slate-500">{helperText}</span>
      ) : null}
    </label>
  );
}
