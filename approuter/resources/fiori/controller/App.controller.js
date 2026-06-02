sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("deltux.pos.fiori.controller.App", {
        onInit: function () {
            // Apply content density mode to root view
            this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass ? this.getOwnerComponent().getContentDensityClass() : "");
        }
    });
});
