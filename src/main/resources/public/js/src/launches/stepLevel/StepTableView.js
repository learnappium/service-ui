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

    var $ = require('jquery');
    var _ = require('underscore');
    var Epoxy = require('backbone-epoxy');
    var Util = require('util');
    var Localization = require('localization');
    var StepItemView = require('launches/stepLevel/StepItemView');
    var LaunchSuiteStepItemsView = require('launches/common/LaunchSuiteStepItemsView');
    var SingletonUserStorage = require('storage/SingletonUserStorage');
    var SingletonLaunchFilterCollection = require('filters/SingletonLaunchFilterCollection');
    var App = require('app');
    var StickyHeader = require('core/StickyHeader');

    var config = App.getInstance();

    var StepTableView = Epoxy.View.extend({
        template: 'tpl-launch-step-table',

        events: {
            'click .rp-grid-th[data-sorter]': 'onClickSorter',
            'click .rp-grid-th[data-filter] .rp-icons-filter': 'onClickFilter',
            'click [data-js-collapse-label]': 'clickCollapseInput',
            'change [data-js-select-all]': 'onChangeSelectAll',
            'change [data-js-collapse-input]': 'onChangeCollapse'
        },
        bindings: {
            '[data-js-table-container]': 'classes: {"exact-driven": updateTimeFormat}',
            '[data-js-select-all]': 'attr: {disabled: validateIsProcessing}'
        },
        computeds: {
            updateTimeFormat: function () {
                var timeFormat = this.userStorage.get('startTimeFormat');
                return timeFormat === 'exact';
            },
            validateIsProcessing: function () {
                return this.getBinding('isProcessing');
            }
        },
        initialize: function (options) {
            var self = this;
            this.context = options.context;
            this.filterModel = options.filterModel;
            this.collectionItems = options.collectionItems;
            if (this.collectionItems.noChildFilter) {
                options.crumbs;
            }
            this.render();

            this.tableItems = new LaunchSuiteStepItemsView({
                context: this.context,
                collection: this.collectionItems,
                itemView: StepItemView,
                filterModel: this.filterModel
            });
            $('[data-js-table-container]', this.$el).append(this.tableItems.$el);

            this.listenTo(this.filterModel, 'change:newSelectionParameters', this.onChangeSelectionParameters);
            this.listenTo(this.collectionItems, 'reset change:select', _.debounce(this.onResetCollection, 100));
            this.onChangeSelectionParameters();
            this.userStorage = new SingletonUserStorage();
            this.userStorage.ready.done(function () {
                self.applyPreconditionsStatus();
            });
            this.setupStickyHeader();
        },
        onShow: function () {
            this.tableItems.onShow && this.tableItems.onShow();
        },
        activateNextId: function (id) {
            this.tableItems.activateNextId(id);
        },
        onResetCollection: function () {
            var notSelectModels = this.collectionItems.where({ select: false });
            if (notSelectModels.length) {
                $('[data-js-select-all]', this.$el).prop('checked', false);
            }
        },
        clickCollapseInput: function (e) {
            e.stopPropagation();
        },
        onChangeCollapse: function (e) {
            config.trackingDispatcher.trackEventNumber(138);
            this.onChangeCollapseInput($(e.currentTarget));
        },
        onChangeCollapseInput: function ($el) {
            var active = $el.is(':checked');
            var title = Localization.launches.showPreconditionMethods;
            this.userStorage.set('statusPreconditions', active);
            this.collectionItems.setPredefinedFilter(active ? 'collapsed' : null);
            $('[data-js-collapse-label]', this.$el).attr('title', title);
        },
        applyPreconditionsStatus: function () {
            var collapseInput = $('[data-js-collapse-input]', this.$el);
            collapseInput.prop('checked', this.userStorage.get('statusPreconditions'));
            this.onChangeCollapseInput(collapseInput, true);
        },
        onChangeSelectAll: function (e) {
            var value = false;
            config.trackingDispatcher.trackEventNumber(151);
            if ($(e.currentTarget).is(':checked')) {
                value = true;
            }
            _.each(this.collectionItems.models, function (model) {
                model.set({ select: value });
            });
        },
        onClickSorter: function (e) {
            var sorter = $(e.currentTarget).data('sorter');
            var filterParams = this.filterModel.getParametersObj();
            switch (sorter) {
            case 'type':
                config.trackingDispatcher.trackEventNumber(140);
                break;
            case 'name':
                config.trackingDispatcher.trackEventNumber(142);
                break;
            case 'status':
                config.trackingDispatcher.trackEventNumber(144);
                break;
            case 'start_time':
                config.trackingDispatcher.trackEventNumber(146);
                break;
            case 'issue$issue_type':
                config.trackingDispatcher.trackEventNumber(148);
                break;
            default: break;
            }

            if (filterParams.sorting_column === sorter) {
                filterParams.is_asc = !filterParams.is_asc;
            } else {
                filterParams.is_asc = true;
                filterParams.sorting_column = sorter;
            }
            this.filterModel.set({
                newSelectionParameters: JSON.stringify(filterParams), curPage: 1
            });
        },
        onClickFilter: function (e) {
            var filterId;
            e.stopPropagation();
            filterId = $(e.currentTarget).closest('.rp-grid-th').data('filter');
            switch (filterId) {
            case 'type':
                config.trackingDispatcher.trackEventNumber(139);
                break;
            case 'name':
                config.trackingDispatcher.trackEventNumber(141);
                break;
            case 'status':
                config.trackingDispatcher.trackEventNumber(143);
                break;
            case 'start_time':
                config.trackingDispatcher.trackEventNumber(145);
                break;
            case 'issue$issue_type':
                config.trackingDispatcher.trackEventNumber(147);
                break;
            default: break;
            }
            this.filterModel.trigger('add_entity', filterId);
        },
        onChangeSelectionParameters: function () {
            var filterParams = this.filterModel.getParametersObj();
            var $element = $('[data-sorter="' + filterParams.sorting_column + '"]', this.$el);
            $('[data-sorter]', this.$el).removeClass('sorting-asc sorting-desc');
            if ($element && $element.length) {
                $element.addClass((filterParams.is_asc) ? 'sorting-asc' : 'sorting-desc');
            }
        },
        render: function () {
            this.$el.html(Util.templates(this.template));
        },
        setupStickyHeader: function () {
            this.destroyStickyHeader();
            this.stickyHeader = new StickyHeader({ fixedBlock: $('[data-js-fixed-header]', this.$el), topMargin: 0, minWidthWindow: 900 });
        },
        destroyStickyHeader: function () {
            this.stickyHeader && this.stickyHeader.destroy();
        },
        onDestroy: function () {
            this.destroyStickyHeader();
            this.tableItems && this.tableItems.destroy();
            this.$el.html('');
            delete this;
        }
    });

    return StepTableView;
});
