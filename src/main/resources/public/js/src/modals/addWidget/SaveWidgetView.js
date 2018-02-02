/*
 * Copyright 2016 EPAM Systems
 *
 *
 * This file is part of EPAM Report Portal.
 * https://github.com/epam/ReportPortal
 *
 * Report Portal is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Report Portal is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Report Portal.  If not, see <http://www.gnu.org/licenses/>.
 */

define(function (require) {
    'use strict';

    var Epoxy = require('backbone-epoxy');
    var Util = require('util');
    var $ = require('jquery');
    var SelectDashboardView = require('modals/addWidget/SelectDashboardView');
    var Localization = require('localization');
    var App = require('app');

    var config = App.getInstance();

    var SaveWidgetView = Epoxy.View.extend({
        className: 'modal-add-widget-save-widget',
        template: 'tpl-modal-add-widget-save-widget',

        bindings: {
            '[data-js-name-input]': 'value: name',
            '[data-js-description]': 'value: description',
            '[data-js-is-shared]': 'checked: share'
        },
        initialize: function (options) {
            this.dashboardModel = options.dashboardModel;
            this.isNoDashboard = options.isNoDashboard;
            // if (this.dashboardModel && this.dashboardModel.get('share')) {
            //     this.model.set('share', true);
            // }
            this.render();

            this.listenTo(this.model, 'change:name', this.onChangeName);
            this.listenTo(this.model, 'change:description', this.onChangeDescription);
            this.listenTo(this.model, 'change:share', this.onChangeShared);

        },
        onChangeDashboard: function (model) {
            this.dashboardModel = model;
            this.updateSharedSwitcher();
            this.trigger('change::dashboard', this.dashboardModel);
        },
        isSharedDashboard: function () {
            return this.dashboardModel && this.dashboardModel.get('share');
        },
        onChangeDescription: function () {
            if (this.dashboardModel) {
                config.trackingDispatcher.trackEventNumber(323);
            } else {
                config.trackingDispatcher.trackEventNumber(312);
            }
        },
        onChangeShared: function () {
            if (this.dashboardModel) {
                config.trackingDispatcher.trackEventNumber(324);
            } else {
                config.trackingDispatcher.trackEventNumber(313);
            }
        },
        onChangeName: function () {
            if (this.validate()) {
                config.trackingDispatcher.trackEventNumber(322);
               // this.trigger('disable:navigation', false);
            } else {
               // this.trigger('disable:navigation', true);
            }
        },
        updateSharedSwitcher: function () {
            if (this.dashboardModel) {
                if (this.isSharedDashboard()) {
                    this.model.set('share', true);
                    $('[data-js-is-shared]', this.$el).prop('disabled', true);
                    $('[data-js-shared-control]', this.$el).addClass('disabled').attr('title', Localization.wizard.widgetOnSharedDashboard);
                } else {
                    this.model.set('share', false);
                    $('[data-js-is-shared]', this.$el).prop('disabled', false);
                    $('[data-js-shared-control]', this.$el).removeClass('disabled').attr('title', '');
                }
            }
        },
        validate: function () {
            if (this.isNoDashboard) {
                return !$('[data-js-name-input]', this.$el).trigger('validate').data('validate-error') && this.dashboardModel;
            }
            return !$('[data-js-name-input]', this.$el).trigger('validate').data('validate-error');
        },
        activate: function () {
            Util.hintValidator($('[data-js-name-input]', this.$el), [
                { validator: 'minMaxRequired', type: 'widgetName', min: 3, max: 128 },
                { validator: 'noDuplications', type: 'widgetName', source: [] }
            ]);
            Util.hintValidator($('[data-js-description]', this.$el), {
                validator: 'maxRequired',
                type: '',
                max: 256
            });
            this.updateSharedSwitcher();
            if (this.isNoDashboard) {
                if (!this.selectDashboard) {
                    this.selectDashboard = new SelectDashboardView();
                    $('[data-js-dashboards-list]', this.$el).removeClass('hide').append(this.selectDashboard.$el);
                    this.listenTo(this.selectDashboard, 'change::dashboard', this.onChangeDashboard);
                }
            }
        },
        render: function () {
            var self = this;
            this.$el.html(Util.templates(this.template, {}));
            $('[data-js-name-input]', this.$el).on('keydown.modal', function (event) {
                if (event.keyCode === 13) {
                    event.preventDefault();
                    $('[data-js-name-input]', self.$el).blur();
                    self.$el.focus();
                }
            });
        },
        onDestroy: function () {
            $('[data-js-name-input]', this.$el).off('keydown.modal');
            this.selectDashboard && this.selectDashboard.destroy();
        }
    });

    return SaveWidgetView;
});
