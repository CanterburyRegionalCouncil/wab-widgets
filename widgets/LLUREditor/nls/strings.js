define({
  root: ({
  	_featureAction_CreateRecord: 'Create LLUR Record',
    _featureAction_RequestStatement: 'Request LLUR Property Statement',
    _featureAction_EditRecord: 'Edit LLUR Record',

    widgetTitle: 'LLUR Editor',
    description: 'Custom widget for manpulating the spatial data associated with the Environment Canterbury Listed Land Use Register',

    tabs: {
      create: "Create Feature",
      edit: "Edit Feature",
      search: "Search"    	
    },

    editorCache: " - Edit Feature",

    create: {
      instruction: "Click one of the following options to create a record of that type.",
      layerButton: {
        layerButtonTooltip:"Click to create a record to this type."
      }
    },

    edit: {
      instructionCreate: "<p>Enter the required details for the new record, and then click <b>Submit</b> to save the record, or <b>Cancel</b> to abandon creating the shape.  Click <b>Request Statement</b> to produce a LLUR statement for the selected area.</p>",
      instructionUpdate: "<p>Click <b>Edit Geometry</b> or use the gemeotry tools to alter the shape of the record, and then click <b>Submit</b> to save the changes to the record, or <b>Cancel</b> to abandon the changes.</p>",
      submitLabel: "Submit",
      submitTooltip: "Click to save the changes to the LLUR Database.",
      submitConfirm: "Are you sure you want to save changes?",
      cancelLabel: "Cancel",
      cancelTooltip: "Click to cancel the edit and return to the map.",
      cancelConfirm: "Are you sure you want to cancel?",
      editGeometryLabel: "Edit Shape",
      editGeometryTooltip: "Click to toggle the edit tools for this feature on or off",
      requestStatementLabel: "Request Statement",
      requestStatementTooltip: "Click to generate a LLUR statement for this selected area.",
      requestStatementConfirm: "Do you want a statement for this area?"    
    },

    search: {

    },

    filterEditor:{
      all: "All",
      noAvailableTempaltes: "No available templates",
      searchTemplates: "Search Templates"
    },

    createCreateLLURFeaturePopup: {
      ok: "Ok",
      cancel: "Cancel",
      titleLabel: "Create a LLUR Record",
      instruction: "Select a Record Type"
    },

    requestLLURStatementPopup: {
      ok: "Ok",
      cancel: "Cancel",
      titleLabel: "Request a LLUR Statement",
      instruction: "Select a search radius"
    },

    messagesDialog: {
      confirmYes: "Yes",
      confirmNo: "No",
      confirmOk: "Ok",
      gotoLLUR: "Go to LLUR Details"
    },

    explodeFeaturesPopup: {
      ok: "OK",
      cancel: "Cancel",
      titleLabel: "Explode Selected Feature"
    },  

    tools: {
      mergeFeatures: "Merge",
      mergeToolTitle: "Merge Multiple Features",
      mergeErrors: {
        multipleLayersError: "Merging features can only be performed on the features from one layer.",
        unsupportedGeometryError: "Merging is only available on line and polygon features.",
        numberOfFeaturesError: "A minimum of two features must be selected before merge tool can be used.",
        generalError: "The merge tool is disabled."
      },
      
      explodeMultipartFeatures: "Explode",
      explodeToolTitle: "Explode Multipart Feature",
      explodeErrors: {
        unsupportedGeometryError: "Exploding is only available on line and polygon features.",
        notMultipartError: "The current feature does not have multipart geometry.",
        generalError: "The explode tool is disbaled."
      },

      cutFeatures: "Cut",
      cutToolTitle: "Cut Feature into Parts",
      cutErrors: {
        invalidCutGeometryError: "There was a problem with the shape drawn to cut the selected feature.",
        noFeaturesCutError: "The shape drawn did not intersect the selected feature.",
        unsupportedGeometryError: "Cut is only available on line and polygon features.",
        generalError: "The cut tool is disabled."
      },
    }  


  })
  // add supported locales below:
  , "zh-cn": true
});
