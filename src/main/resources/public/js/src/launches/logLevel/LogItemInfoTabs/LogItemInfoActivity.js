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
    var Service = require('coreService');
    var Moment = require('moment');
    var MarkdownViewer = require('components/markdown/MarkdownViewer');
    var Localization = require('localization');
    // var Textile = require('textile');

    var LogItemInfoActivityItemModel = Epoxy.Model.extend({
        defaults: {
            lastModifiedDate: 0,
            userRef: '',
            history: {},
            actionType: ''
        },
        computeds: {
            fullTime: {
                deps: ['lastModifiedDate'],
                get: function (lastModifiedDate) {
                    return Util.dateFormat(lastModifiedDate);
                }
            },
            momentTime: {
                deps: ['lastModifiedDate'],
                get: function (lastModifiedDate) {
                    return Moment(Util.dateFormat(lastModifiedDate)).fromNow();
                }
            },
            fullName: {
                deps: ['userRef'],
                get: function (userRef) {
                    return userRef.replace('_', ' ');
                }
            },
            actionName: {
                deps: ['history', 'actionType', 'userRef'],
                get: function (history, actionType, userRef) {
                    switch (actionType) {
                        case 'update_item': {
                            return _.size(history) > 1 ?
                                Localization.itemEvents.updateItemIssue :
                                Localization.itemEvents.updateItem;
                        }
                        case 'post_issue': return Localization.itemEvents.postIssue;
                        case 'attach_issue': return Localization.itemEvents.attachIssue;
                        case 'analyze_item': return userRef + ' ' + Localization.itemEvents.changedByAnalyzer;
                        case 'attach_issue_aa': return userRef + ' ' + Localization.itemEvents.issueAttachByAnalyzer;
                        default: break;
                    }
                }
            },
            actionsHtml: {
                deps: ['history'],
                get: function (history) {
                    var result = '';
                    _.each(history, function (item) {
                        result += '<div class="action-row">';
                        if (item.field === 'ticketId') {
                            result += '<div class="action-item"><span>FROM: </span>' + this.getActionTicketsHtml(item.oldValue) + '</div>' +
                                '<div class="separate-items"><i class="material-icons">keyboard_arrow_right</i></div>' +
                                '<div class="action-item"><span>TO: </span>' + this.getActionTicketsHtml(item.newValue) + '</div>';
                        } else if (item.field === 'ignoreAnalyzer') {
                            result += '<div class="action-item"><span>FROM: </span>' +
                                ((item.oldValue === 'true') ? Localization.launches.ignoreAA : '') + '</div>' +
                                '<div class="separate-items"><i class="material-icons">keyboard_arrow_right</i></div>' +
                                '<div class="action-item"><span>TO: </span>' +
                                ((item.newValue === 'true') ? Localization.launches.ignoreAA : '') + '</div>';
                        } else {
                            result += '<div class="action-item"><span>FROM: </span>' + this.getActionValueHtml(item.oldValue) + '</div>' +
                                '<div class="separate-items"><i class="material-icons">keyboard_arrow_right</i></div>' +
                                '<div class="action-item"><span>TO: </span>' + this.getActionValueHtml(item.newValue) + '</div>';
                        }
                        result += '</div>';
                    }, this);
                    return result;
                }
            }
        },
        getActionTicketsHtml: function (tickets) {
            var tickets = tickets || '';
            var ticketMas = tickets.split(',');
            var resultMas = [];
            _.each(ticketMas, function (ticket) {
                var ticketObj = Util.getTicketUrlId(ticket);
                resultMas.push(ticketObj.url ? '<a target="_blank" class="rp-blue-link-undrl" href="' +
                    ticketObj.url + '">' + ticketObj.id + '</a>' : ticketObj.id);
            });
            return resultMas.join(',');
        },
        getActionValueHtml: function (value) {
            var markdownViewer = new MarkdownViewer({ text: value });
            return markdownViewer.$el.wrap('<p/>').parent().html();
        }
    });

    var LogItemInfoActivityItemView = Epoxy.View.extend({
        template: 'tpl-launch-log-item-info-activity-item',
        className: 'activity-row',

        bindings: {
            '[data-js-user-name]': 'text: userRef',
            '[data-js-action-name]': 'text: actionName',
            '[data-js-moment-time]': 'text: momentTime',
            '[data-js-full-time]': 'text: fullTime',
            '[data-js-difference]': 'html: actionsHtml',
            '[data-js-name-cell]': 'classes: {hide: isHideNameCell}',
            '[data-js-action-cell]': 'classes: {"double-column-width": isHideNameCell}'
        },
        computeds: {
            isHideNameCell: {
                deps: ['actionType'],
                get: function (actionType) {
                    return actionType === 'analyze_item' || actionType === 'attach_issue_aa';
                }
            }
        },
        initialize: function () {
            this.render();
        },
        render: function () {
            this.$el.html(Util.templates(this.template, {}));
        }
    });

    var LogItemInfoActivityView = Epoxy.View.extend({
        template: 'tpl-launch-log-item-info-activity',

        events: {
            'click [data-js-close]': 'onClickClose'
        },

        initialize: function (options) {
            this.render();
            this.isLoad = false;
            this.itemModel = options.itemModel;
            this.parentModel = options.parentModel;
            this.listenTo(this.parentModel, 'change:activity', this.onShow);
        },
        onShow: function (model, show) {
            if (show && !this.isLoad) {
                this.isLoad = true;
                this.listenTo(this.itemModel, 'change:issue', this.load);
                this.load();
            }
        },
        load: function () {
            $('[data-js-activity-container]', this.$el).html('');
            $('[data-js-activity-wrapper]', this.$el).addClass('load');
            $('[data-js-activity-wrapper]', this.$el).removeClass('not-found');
            var self = this;
            Service.loadActivityItems(this.itemModel.get('id'))
                .done(function (data) {
                    self.parse(data);
                })
                .fail(function () {
                    $('[data-js-activity-wrapper]', self.$el).addClass('not-found');
                })
                .always(function () {
                    $('[data-js-activity-wrapper]', self.$el).removeClass('load');
                });
        },
        parse: function (data) {
            var self = this;
            var $activityContainer = $('[data-js-activity-container]', this.$el);
            if (data.length == 0) {
                $('[data-js-activity-wrapper]', self.$el).addClass('not-found');
            } else {
                $('[data-js-activity-wrapper]', self.$el).removeClass('not-found');
                _.each(data, function (dataModel) {
                    var model = new LogItemInfoActivityItemModel(dataModel);
                    $activityContainer.append((new LogItemInfoActivityItemView({ model: model })).$el);
                });
            }
        },
        render: function () {
            this.$el.html(Util.templates(this.template), {});
        },
        onClickClose: function () {
            this.parentModel.set({ activity: false });
        },

        destroy: function () {
            this.undelegateEvents();
            this.stopListening();
            this.unbind();
            this.$el.html('');
            delete this;
        }
    });

    return LogItemInfoActivityView;
});
