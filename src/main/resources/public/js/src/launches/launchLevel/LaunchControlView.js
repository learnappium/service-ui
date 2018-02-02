/*
 * This file is part of Report Portal.
 *
 * Report Portal is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Report Portal is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Report Portal.  If not, see <http://www.gnu.org/licenses/>.
 */
define(function (require) {
    'use strict';

    var Util = require('util');
    var $ = require('jquery');
    var Epoxy = require('backbone-epoxy');
    var App = require('app');
    var Localization = require('localization');
    var Service = require('coreService');
    var FilterEntitiesView = require('filterEntities/FilterEntitiesView');
    var ModalAddWidget = require('modals/addWidget/modalAddWidget');
    var ModalImportLaunch = require('modals/importLaunch/modalImportLaunch');

    var config = App.getInstance();

    var LaunchControlView = Epoxy.View.extend({
        events: {
            'click [data-js-refresh]': 'onClickRefresh',
            'click [data-js-multi-action]': 'onClickMultiAction',
            'click [data-js-multi-button]': 'onShowMultiActon',
            'click [data-js-add-widget]': 'onClickAddWidget',
            'click [data-js-import]': 'onClickImport'
        },

        bindings: {
            '[data-js-refresh-counter]': 'text: refreshItems, classes: {hide: not(refreshItems)}'
        },

        template: 'tpl-launch-launch-control',
        initialize: function (options) {
            this.collectionItems = options.collectionItems;
            this.filterModel = options.filterModel;
            this.context = options.context;
            this.model = new (Epoxy.Model.extend({
                defaults: {
                    refreshItems: 0
                }
            }))();
            this.render();
            if (this.filterModel.get('id') === 'all') {
                $('[data-js-add-widget]', this.$el).addClass('hide');
            } else {
                $('[data-js-import]', this.$el).addClass('hide');
            }
            if (this.context === 'userdebug') {
                $('[data-js-import]', this.$el).addClass('hide');
                $('[data-js-add-widget]', this.$el).addClass('hide');
                this.filterEntities = new FilterEntitiesView({
                    el: $('[data-js-refine-entities]', this.$el),
                    filterLevel: 'launch',
                    model: this.filterModel
                });
            }

            if (config.userModel.getRoleForCurrentProject() === config.projectRolesEnum.customer) {
                $('[data-js-multi-action="changemode"]', this.$el).addClass('hide');
            }
            this.listenTo(this.collectionItems, 'reset', this.onResetCollectionItems);
            this.onResetCollectionItems();
        },
        render: function () {
            this.$el.html(Util.templates(this.template, { context: this.context }));
        },
        onResetCollectionItems: function () {
            this.model.set({ refreshItems: 0 });
            this.request && this.request.abort();
            clearTimeout(this.timeout);
            this.inProgressItems = this.collectionItems.where({ status: config.launchStatus.inProgress });
            this.checkItems();
        },
        checkItems: function () {
            if (this.inProgressItems.length) {
                var self = this;
                var ids = _.map(this.inProgressItems, function (item) { return item.get('id'); });
                this.request = Service.checkForStatusUpdate(ids)
                    .done(function (result) {
                        var newInProgressItems = [];
                        _.each(self.inProgressItems, function (item) {
                            if (result[item.get('id')] !== config.launchStatus.inProgress) {
                                item.set({
                                    status: result[item.get('id')],
                                    end_time: (new Date()).getTime()
                                });
                                self.model.set({ refreshItems: self.model.get('refreshItems') + 1 });
                            } else {
                                newInProgressItems.push(item);
                            }
                        });
                        self.inProgressItems = newInProgressItems;
                        clearTimeout(self.timeout);
                        self.timeout = setTimeout(function () {
                            self.checkItems();
                        }, 5000);
                    });
            }
        },
        activateMultiple: function () {
            $('[data-js-refresh]', this.$el).addClass('disabled');
            $('[data-js-multi-button]', this.$el).removeClass('disabled').attr({ title: Localization.ui.actions });
        },
        disableMultiple: function () {
            $('[data-js-refresh]', this.$el).removeClass('disabled');
            $('[data-js-multi-button]', this.$el).addClass('disabled').attr({ title: Localization.launches.actionTitle });
        },
        onShowMultiActon: function () {
            config.trackingDispatcher.trackEventNumber(61.3);
        },
        onClickAddWidget: function (e) {
            e.preventDefault();
            e.stopPropagation();
            config.trackingDispatcher.trackEventNumber(17);
            (new ModalAddWidget({ filter_id: this.collectionItems.filterModel.get('id'), isNoDashboard: true })).show();
        },
        onClickMultiAction: function (e) {
            var type = $(e.currentTarget).data('js-multi-action');
            switch (type) {
            case 'merge':
                config.trackingDispatcher.trackEventNumber(62);
                break;
            case 'compare':
                config.trackingDispatcher.trackEventNumber(63);
                break;
            case 'changemode':
                config.trackingDispatcher.trackEventNumber(64);
                break;
            case 'forcefinish':
                config.trackingDispatcher.trackEventNumber(65);
                break;
            case 'remove':
                config.trackingDispatcher.trackEventNumber(66);
                break;
            }
            this.trigger('multi:action', type);
        },
        onClickRefresh: function () {
            this.collectionItems.load();
        },
        onClickImport: function () {
            (new ModalImportLaunch()).show();
        },
        onDestroy: function () {
            this.request && this.request.abort();
            clearTimeout(this.timeout);
            this.$el.html('');
        }
    });


    return LaunchControlView;
});
