define(["dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/array",
    "dojo/date/locale",
    "dojo/dom-class",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/text!./templates/operationLink.html",
    "dojo/i18n!../nls/strings",
    "../utils"
  ],
  function(declare, lang, array, locale, domClass, _WidgetBase, _TemplatedMixin,
    _WidgetsInTemplateMixin, template, i18n, util) {

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {

      i18n: i18n,
      templateString: template,
      item: null,

      postCreate: function() {
        this.inherited(arguments);
      },

      startup: function() {
        if (this._started) {
          return;
        }
        this.inherited(arguments);
        this.render();
      },

      linkClicked: function() {
          var url = this.item.href;
          var paramAttr = this.item.attr;

          if (this.fieldValues && paramAttr !== "") {
            var fieldValue = "";

            if (this.fieldValues && this.fieldValues.length > 0) {
              array.some(this.fieldValues, lang.hitch(this, function (field) {
                if (field.fieldName === paramAttr) {
                  fieldValue = field.value;
                  return false;
                }
              }));
            }

            url = url.replace(/\{([a-zA-Z]+)\}/g,lang.hitch(this, function (match) {
                          var token = match.replace(/\{|\}/g, "");
                          if (token === paramAttr) {
                              return fieldValue
                          }
                      }));
          }
         
          window.open(url,"_self");        
      },

      render: function() {
        // TODO escape text or not?
        //util.setNodeText(this.titleNode, this.item.title);
        //util.setNodeTitle(this.titleNode, this.item.title);
      },

      destroy: function () {
        this.inherited(arguments);
      }
    });

  });