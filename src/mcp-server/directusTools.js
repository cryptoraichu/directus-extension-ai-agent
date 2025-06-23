const directusTools = [
  {
    type: "function",
    function: {
      name: "system-prompt",
      description:
        "Get system information and role. This should be the first call.",
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "users-me",
      description: "Get current user information.",
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "read-users",
      description: "List users. Use for searching by name.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "object",
            properties: {
              filter: { type: "object", description: "User filtering" },
              fields: { type: "array", items: { type: "string" } },
              limit: { type: "number" },
              search: { type: "string", description: "Name search" },
            },
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "read-collections",
      description:
        "Dynamically get all available collections and their structures.",
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "read-items",
      description:
        "Get data from any collection. Dynamically determine collection name.",
      parameters: {
        type: "object",
        properties: {
          collection: {
            type: "string",
            description: "Dynamic collection name",
          },
          query: {
            type: "object",
            properties: {
              filter: { type: "object" },
              limit: { type: "number" },
              offset: { type: "number" },
              fields: { type: "array", items: { type: "string" } },
              sort: { type: "array", items: { type: "string" } },
              search: { type: "string" },
            },
          },
        },
        required: ["collection"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create-item",
      description: "Add dynamic data to any collection.",
      parameters: {
        type: "object",
        properties: {
          collection: { type: "string", description: "Collection name" },
          item: {
            type: "object",
            description: "Record data to create",
            additionalProperties: true,
          },
        },
        required: ["collection", "item"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update-item",
      description: "Update existing record.",
      parameters: {
        type: "object",
        properties: {
          collection: { type: "string", description: "Collection name" },
          id: { type: "string", description: "Record ID" },
          data: {
            type: "object",
            description: "Data to update",
            additionalProperties: true,
          },
        },
        required: ["collection", "id", "data"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "read-flows",
      description: "List automated workflows.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "object" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "trigger-flow",
      description: "Trigger workflow.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "Flow ID" },
          data: { type: "object", additionalProperties: true },
          keys: { type: "array", items: { type: "string" } },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "read-folders",
      description: "List file folders.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "object" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "read-files",
      description: "List files or get single file information.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "object" },
          id: { type: "string", description: "File ID" },
          raw: { type: "boolean", description: "Get raw content" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "import-file",
      description: "Upload file from URL.",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string", description: "File URL" },
          data: { type: "object", additionalProperties: true },
        },
        required: ["url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update-files",
      description: "Update file information.",
      parameters: {
        type: "object",
        properties: {
          ids: { type: "array", items: { type: "string" } },
          data: { type: "object", additionalProperties: true },
        },
        required: ["ids", "data"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "read-fields",
      description: "Get field definitions.",
      parameters: {
        type: "object",
        properties: {
          collection: {
            type: "string",
            description: "Collection name (optional)",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "read-field",
      description: "Get specific field definition.",
      parameters: {
        type: "object",
        properties: {
          collection: { type: "string", description: "Collection name" },
          field: { type: "string", description: "Field name" },
        },
        required: ["collection", "field"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create-field",
      description: "Create new field.",
      parameters: {
        type: "object",
        properties: {
          collection: { type: "string", description: "Collection name" },
          field: { type: "object", additionalProperties: true },
        },
        required: ["collection", "field"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update-field",
      description: "Update field definition.",
      parameters: {
        type: "object",
        properties: {
          collection: { type: "string", description: "Collection name" },
          field: { type: "string", description: "Field name" },
          data: { type: "object", additionalProperties: true },
        },
        required: ["collection", "field", "data"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "read-comments",
      description: "Get record comments.",
      parameters: {
        type: "object",
        properties: {
          collection: { type: "string", description: "Collection name" },
          item: { type: "string", description: "Record ID" },
        },
        required: ["collection", "item"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "upsert-comment",
      description: "Add or update comment.",
      parameters: {
        type: "object",
        properties: {
          collection: { type: "string", description: "Collection name" },
          item: { type: "string", description: "Record ID" },
          comment: { type: "string", description: "Comment text" },
          id: { type: "string", description: "Comment ID (for update)" },
        },
        required: ["collection", "item", "comment"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "markdown-tool",
      description: "HTML-Markdown conversion.",
      parameters: {
        type: "object",
        properties: {
          content: { type: "string", description: "Content to convert" },
          to: {
            type: "string",
            enum: ["html", "markdown"],
            description: "Target format",
          },
        },
        required: ["content", "to"],
      },
    },
  },
];

export default directusTools;
