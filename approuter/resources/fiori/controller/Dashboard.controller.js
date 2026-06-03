sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("deltux.pos.fiori.controller.Dashboard", {
        onInit: function () {
        },

        onNavToProducts: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("RouteProducts");
        },

        onNavToAlerts: function () {
            sap.m.MessageToast.show("Alerts view not implemented yet.");
        },

        onNavBackToMainApp: function () {
            window.location.href = "/dashboard";
        }
    });
});
