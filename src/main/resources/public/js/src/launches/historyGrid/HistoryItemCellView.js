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
    var App = require('app');
    var SingletonDefectTypeCollection = require('defectType/SingletonDefectTypeCollection');
    var LaunchSuiteDefectsHoverView = require('launches/common/LaunchSuiteDefectsHoverView');
    var SimpleTooltipView = require('tooltips/SimpleTooltipView');
    var MarkdownViewer = require('components/markdown/MarkdownViewer');

    var config = App.getInstance();


    var HistoryItemCellView = Epoxy.View.extend({
        template: 'tpl-launch-history-item-cell',
        issueTpl: 'tpl-launch-history-item-issue',
        statisticsTpl: 'tpl-launch-history-item-stats',
        attributes: function () {
            return { 'data-js-history-cell': '' };
        },
        bindings: {
            '[data-js-history-cell]': 'getClass: status',
            '[data-js-history-statistics]': 'getStatistics: statistics',
            '[data-js-history-issue]': 'getIssue: issue'
        },
        bindingHandlers: {
            getClass: {
                set: function ($el, status) {
                    var cellWidth = this.view.getCellWidth();
                    var statusCls = 'history-status-' + status;
                    $el.css('width', cellWidth + '%');
                    $el.addClass('history-col ' + statusCls);
                }
            },
            getStatistics: {
                set: function ($el, stats) {
                    var model = this.view.model;
                    var issue = model.get('issue');
                    var defects;
                    var defectsByType = {};
                    var sd;
                    var defectType;
                    var issueType;
                    if (!issue) {
                        $el.html('');
                        defects = stats.defects;
                        _.each(defects, function (val, defect) {
                            if (val.total !== 0) {
                                sd = config.patterns.defectsLocator;
                                defectType = _.findKey(val, function (v, k) {
                                    return sd.test(k);
                                });
                                if (defectType) {
                                    issueType = this.view.defectsCollection
                                        .getDefectType(defectType);
                                    if (issueType) {
                                        defectsByType[defect] = {
                                            shortName: issueType.shortName,
                                            fullName: issueType.longName,
                                            color: issueType.color || Util.getDefaultColor(defect),
                                            cls: Util.getDefectCls(defect)
                                        };
                                    }
                                }
                            }
                        }, this);
                        $el.append(Util.templates(this.view.statisticsTpl, {
                            stats: defectsByType
                        }));
                    }
                    return '';
                }
            },
            getIssue: {
                set: function ($el) {
                    var objIssue;
                    var issueType;
                    var data;
                    var model = this.view.model;
                    var issue = model.get('issue');
                    function getMarkdownHtml(value) {
                        var markdownViewer = new MarkdownViewer({ text: value });
                        var html = markdownViewer.$el.wrap('<p/>').parent().html();
                        markdownViewer.destroy();
                        return html;
                    }
                    if (issue) {
                        $el.html('');
                        objIssue = model.getIssue();
                        issueType = this.view.defectsCollection.getDefectType(objIssue.issue_type);
                        data = {
                            tickets: _.map(objIssue.externalSystemIssues, function (t) { return t.ticketId; }).join(', '),
                            comment: objIssue.comment ? getMarkdownHtml(objIssue.comment.setMaxLength(256)) : '',
                            issueType: issueType,
                            cls: Util.getDefectCls(issueType.typeRef.toLocaleLowerCase())
                        };
                        $el.append(Util.templates(this.view.issueTpl, { stats: data }));
                    }
                    return '';
                }
            }
        },
        getUrl: function () {
            var link;
            if (this.itemInLaunch && this.itemInLaunch.length === 1) {
                link = '#' + this.model.appModel.get('projectId') + '/launches/all/';
                link += this.model.get('launchId');
                if (this.itemInLaunch[0].path_names) {
                    _.each(Object.keys(this.itemInLaunch[0].path_names), function (key) {
                        link += '/' + key;
                    });
                }
                if (this.itemInLaunch[0].has_childs) {
                    link += '/' + this.model.get('id');
                } else {
                    link += '?log.item=' + this.model.get('id');
                }
                return link;
            }
            return undefined;
        },
        initialize: function (options) {
            this.cellWidth = options.cellWidth;
            this.itemInLaunch = options.itemInLaunch;
            this.$container = options.container;
            this.defectsCollection = new SingletonDefectTypeCollection();
            this.defectsCollection.ready.done(function () {
                this.render();
            }.bind(this));
        },
        events: {
            'mouseenter [data-tooltip-type]': 'showTooltip'
        },
        render: function () {
            var link = this.getUrl();
            this.$container.append(this.$el.addClass()
                .html(Util.templates(this.template, {
                    link: link,
                    class: link ? 'cell-link available' : 'cell-link'
                }))
            );
        },
        getCellWidth: function () {
            return this.cellWidth;
        },
        showTooltip: function (e) {
            var el = $(e.currentTarget);
            var type = el.data('tooltipType');
            if (!el.data('tooltip')) {
                el.data('tooltip', 'tooltip');
                this.createTooltip(el, type);
            }
        },
        createTooltip: function (el, type) {
            var $hoverElement = el;
            var self = this;
            if (type === 'warning' || type === 'comment' || type === 'tickets' || type === 'issue') {
                Util.appendTooltip(function () {
                    var tooltip = new SimpleTooltipView({
                        width: 200,
                        message: (type === 'issue') ?
                            '<span class="defect-color" style="background: ' + el.css('backgroundColor') + '"></span>' + ' ' + el.data('tooltip-content') :
                            el.data('tooltip-content')
                    });
                    return tooltip.$el;
                }, $hoverElement, $hoverElement);
                el.uitooltip('option', 'position', { my: 'center+7.5 top+10', collision: 'flipfit' }).uitooltip('open');
            } else {
                Util.appendTooltip(function () {
                    var hoverView = new LaunchSuiteDefectsHoverView({
                        type: type,
                        noLink: true,
                        model: self.model
                    });
                    return hoverView.$el;
                }, $hoverElement, $hoverElement);
                el.uitooltip('option', 'position', { my: 'center+7.5 top+10', collision: 'flipfit' }).uitooltip('open');
            }
        },
        onDestroy: function () {
            this.$el.html('');
            delete this;
        }
    });

    return HistoryItemCellView;
});
