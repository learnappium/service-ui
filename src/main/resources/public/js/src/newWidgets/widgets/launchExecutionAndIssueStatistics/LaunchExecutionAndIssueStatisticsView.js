/*
 * Copyright 2016 EPAM Systems
 *
 *
 * This file is part of EPAM Report Portal.
 * https://github.com/reportportal/service-ui
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
    var Util = require('util');
    var C3ChartWidgetView = require('newWidgets/_C3ChartWidgetView');
    var SingletonDefectTypeCollection = require('defectType/SingletonDefectTypeCollection');
    var SingletonLaunchFilterCollection = require('filters/SingletonLaunchFilterCollection');
    var Localization = require('localization');
    var d3 = require('d3');
    var c3 = require('c3');
    var App = require('app');
    var config = App.getInstance();

    var LaunchExecutionAndIssueStatisticsWidget = C3ChartWidgetView.extend({
        template: 'tpl-widget-launch-execution-and-issue-statistics',
        className: 'launch-execution-and-issue-statistics',

        render: function () {
            var statusChartData = {};
            var statusChartDataOrdered = [];
            var defectTypesChartData = {};
            var defectTypesChartDataOrdered = [];

            if (this.isPreview) {
                this.$el.addClass('preview-view');
            }
            if (!this.isDataExists()) {
                this.addNoAvailableBock();
                return;
            }
            this.charts = [];
            this.scrollers = [];
            _.each(this.model.getContent().result[0].values, function (val, key) {
                if (~key.indexOf('$executions$')) {
                    statusChartData[key] = +val;
                } else {
                    defectTypesChartData[key] = +val;
                }
            });
            // statusChartData.statistics$executions$total && (statusChartDataOrdered.push(['statistics$executions$total', statusChartData.statistics$executions$total]));
            statusChartData.statistics$executions$passed && (statusChartDataOrdered.push(['statistics$executions$passed', statusChartData.statistics$executions$passed]));
            statusChartData.statistics$executions$failed && (statusChartDataOrdered.push(['statistics$executions$failed', statusChartData.statistics$executions$failed]));
            statusChartData.statistics$executions$skipped && (statusChartDataOrdered.push(['statistics$executions$skipped', statusChartData.statistics$executions$skipped]));

            _.each(this.model.getContentFields(), function (field) {
                _.each(defectTypesChartData, function (val, key) {
                    if (field === key) {
                        defectTypesChartDataOrdered.push([field, defectTypesChartData[field]]);
                    }
                });
            });
            if (+statusChartDataOrdered.statistics$executions$total === 0 || ((!defectTypesChartDataOrdered.length) && (!statusChartDataOrdered.legth))) {
                this.addNoAvailableBock();
                return;
            }
            this.defetTypesCollection = new SingletonDefectTypeCollection();
            this.launchFilterCollection = new SingletonLaunchFilterCollection();
            this.defetTypesCollection.ready.done(function () {
                this.launchFilterCollection.ready.done(function () {
                    this.$el.html(Util.templates(this.template, {}));
                    this.$el.addClass('donut-chart-view');
                    if (!defectTypesChartDataOrdered.length) {
                        this.$el.addClass('left-chart-hidden');
                    }
                    if (!defectTypesChartDataOrdered.length) {
                        this.$el.addClass('right-chart-hidden');
                    }
                    if (statusChartDataOrdered.length) {
                        $('[data-js-left-chart-container]', this.$el).addClass('status-chart');
                        this.drawDonutChart($('[data-js-left-chart-container]', this.$el), statusChartDataOrdered);
                    }
                    if (defectTypesChartDataOrdered.length) {
                        $('[data-js-right-chart-container]', this.$el).addClass('issues-chart');
                        this.drawDonutChart($('[data-js-right-chart-container]', this.$el), defectTypesChartDataOrdered);
                    }
                    this.restyleDonutTitle();
                }.bind(this));
            }.bind(this));
        },

        drawDonutChart: function ($el, data) {
            var self = this;
            var chart;
            var itemNames = [];
            var colors = {};
            var total = 0;
            var donutTitle = '';
            var legendScroller;

            _.each(data, function (val) {
                var defectModel;
                if (~val[0].indexOf('$executions$')) {
                    colors[val[0]] = config.defaultColors[val[0].split('$')[2]];
                } else {
                    defectModel = _.find(this.defetTypesCollection.models, function (model) {
                        return model.get('locator') === val[0].split('$')[3];
                    });
                    defectModel && (colors[val[0]] = defectModel.get('color'));
                }
                total += val[1];
                itemNames.push(val[0]);
            }.bind(this));
            chart = c3.generate({
                bindto: $el[0],
                data: {
                    columns: data,
                    type: 'donut',
                    onclick: function (d, element) {
                        config.router.navigate(
                            self.linkToRedirectService(d.id.split('$')[d.id.split('$').length - 1],
                            self.model.getContent().result[0].id),
                            { trigger: true });
                    },
                    order: null,
                    colors: colors
                },
                interaction: {
                    enabled: !self.isPreview
                },
                padding: {
                    top: self.isPreview ? 0 : 85
                },
                legend: {
                    show: false // we use custom legend
                },
                donut: {
                    title: total,
                    label: {
                        show: false,
                        threshold: 0.05
                    }
                },
                tooltip: {
                    position: function (d, width, height, element) {
                        var left = d3.mouse(chart.element)[0] - (width / 2);
                        var top = d3.mouse(chart.element)[1] - height;
                        return {
                            top: top - 8, // 8 - offset for tooltip arrow
                            left: left
                        };
                    },
                    contents: function (d, defaultTitleFormat, defaultValueFormat, color) {
                        var name;
                        var defectModel;
                        if (~d[0].id.indexOf('$executions$')) {
                            name = Localization.filterNameById[d[0].id].toUpperCase();
                        } else {
                            defectModel = self.defetTypesCollection.getDefectByLocator(d[0].id.split('$')[3]);
                            if (defectModel) {
                                name = defectModel.get('longName');
                            } else {
                                return '<div class="tooltip-title-invalid">' +
                                    '<div class="color-mark-invalid"></div>' +
                                    d[0].id.split('$')[3] +
                                    '</div>';
                            }
                        }
                        return '<div class="tooltip-val">' + d[0].value + ' (' + self.getRoundedToDecimalPlaces(d[0].ratio * 100, 2).toFixed(2) + '%)</div>' +
                            '<div class="tooltip-title">' +
                            '<div class="color-mark" style="background-color: ' + color(d[0].id) + ';"></div>' +
                            name +
                            '</div>';
                    }
                },
                onrendered: function () {
                    $el.css('max-height', 'none');
                    if (chart) {
                        total = 0;
                        _.each(chart.data.shown(), function (dataItem) {
                            total += dataItem.values[0].value;
                        });
                    }
                    self.restyleDonutTitle();
                    $('.c3-chart-arcs-title', $el).contents()[0].textContent = total;
                }
            });
            this.charts.push(chart);

            // Configuring custom legend block
            if (!self.isPreview) {
                d3.select(chart.element)
                    .insert('div', '.chart')
                    .attr('class', 'legend')
                    .insert('div', '.legend')
                    .attr('data-js-legend-wrapper', '') // wrapper for BaronScroll
                    .selectAll('span')
                    .data(itemNames)
                    .enter()
                    .append('span')
                    .attr('data-id', function (id) { return id; })
                    .html(function (id) {
                        var name;
                        var defectModel;
                        if (~id.indexOf('$executions$')) {
                            name = Localization.filterNameById[id];
                        } else {
                            defectModel = self.defetTypesCollection.getDefectByLocator(id.split('$')[3]);
                            if (defectModel) {
                                name = defectModel.get('longName');
                            } else {
                                return '<div class="invalid-color-mark"></div><span class="invalid">' + id.split('$')[3] + '</span>';
                            }
                        }
                        return '<div class="color-mark"></div>' + name;
                    })
                    .each(function (id) {
                        if (~self.hiddenItems.indexOf(id)) {
                            $('.color-mark', $(this)).addClass('unchecked');
                        }
                        d3.select(this).select('.color-mark').style('background-color', chart.color(id));
                    })
                    .on('mouseover', function (id) {
                        chart.focus(id);
                    })
                    .on('mouseout', function (id) {
                        chart.revert();
                    })
                    .on('click', function (id) {
                        config.trackingDispatcher.trackEventNumber(342);
                        $('.color-mark', $(this)).toggleClass('unchecked');
                        chart.toggle(id);
                    });
                this.hiddenItems && chart.hide(this.hiddenItems);
                d3.select(chart.element).select('.legend')
                    .append('div')
                    .attr('class', 'legend-gradient')
                    .append('div')
                    .attr('class', 'legend-border');
                legendScroller = Util.setupBaronScroll($('[data-js-legend-wrapper]', $el));
                this.scrollers.push(legendScroller);
            }

            // Configuring custom donut chart title
            if ($el.hasClass('status-chart')) {
                donutTitle = Localization.widgets.pieSum;
            } else if ($el.hasClass('issues-chart')) {
                donutTitle = Localization.widgets.pieIssues;
            }
            d3.select(chart.element).select('.c3-chart-arcs-title').attr('dy', -5)
                .append('tspan')
                .attr('dy', 16)
                .attr('x', 0)
                .text(donutTitle);
        },
        restyleDonutTitle: function () {
            if (!(this.$el.hasClass('w-less-then-6') || this.$el.hasClass('h-less-then-6') || this.$el.hasClass('preview-view'))) {
                $('.c3-chart-arcs-title', this.$el).attr('dy', '-10').find('tspan').attr('dy', '30');
            } else {
                $('.c3-chart-arcs-title', this.$el).attr('dy', '-5').find('tspan').attr('dy', '15');
            }
        },
        onBeforeDestroy: function () {
            _.each(this.scrollers, function (baronScrollElem) {
                baronScrollElem.baron && baronScrollElem.baron().dispose();
            });
        }
    });

    return LaunchExecutionAndIssueStatisticsWidget;
});
