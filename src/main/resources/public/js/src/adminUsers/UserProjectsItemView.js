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
    var CallService = require('callService');
    var memberService = require('memberService');
    var Urls = require('dataUrlResolver');
    var ModalConfirm = require('modals/modalConfirm');
    var Localization = require('localization');
    var DropDownComponent = require('components/DropDownComponent');

    var config = App.getInstance();

    var MembersItemView = Epoxy.View.extend({
        tpl: 'tpl-users-projects-item',
        className: 'row rp-table-row user-projects-row',

        bindings: {
            '[data-js-project]': 'text: projectId',
            '[data-js-project-role]': 'text: getProjectRole',
            '[data-js-dropdown-roles]': 'updateRoleDropDown: projectRole',
            '[data-js-unassign]': 'classes: {disabled: not(canUnAssign)}, attr: {disabled: not(canUnAssign)}',
            // '[data-js-user-select-role]': 'classes: {hide: isAdmin}',
            // '[data-js-admin-role]': 'classes: {hide: not(isAdmin)}',

        },

        computeds: {
            canUnAssign: {
                deps: ['projectId', 'entryType'],
                get: function () {
                    return !this.isPersonalProjectOwner() && !this.unassignedLock();
                }
            },
            getProjectRole: {
                deps: ['projectRole'],
                get: function (projectRole) {
                    var roles = Util.getRolesMap();
                    return roles[projectRole];
                }
            }
            // isAdmin: {
            //     get: function () {
            //         return this.userModel.get('userRole') === config.accountRoles[1];
            //     }
            // }
        },

        bindingHandlers: {
            updateRoleDropDown: {
                set: function ($el, role) {
                    _.each($('a', $el), function (a) {
                        var action = $(a).data('value') === role ? 'add' : 'remove';
                        $(a)[action + 'Class']('active');
                    });
                }
            }
        },

        events: {
            'click [data-js-unassign]': 'confirmUnassign',
            'click [data-js-project]': 'redirectToProject'
        },

        initialize: function (options) {
            this.userModel = options.userModel;
            this.render();
        },

        render: function () {
            this.$el.html(Util.templates(this.tpl, {
                roles: Util.getRolesMap(),
                isPersonal: this.isPersonalProjectOwner()
            }));
            this.setupSelectDropDown();
        },

        setupSelectDropDown: function () {
            this.projectRoleSelector = new DropDownComponent({
                data: _.map(Util.getRolesMap(), function (key, val) {
                    return { name: key, value: val };
                }),
                multiple: false,
                defaultValue: this.model.get('projectRole')
            });
            $('[data-js-user-select-role]', this.$el).html(this.projectRoleSelector.$el);
            this.listenTo(this.projectRoleSelector, 'change', this.updateProjectRole);
        },

        isPersonalProjectOwner: function () {
            var projectId = this.model.get('projectId');
            var isPersonalProject = this.model.get('entryType') === 'PERSONAL';
            return isPersonalProject && (projectId === this.userModel.get('userId') + '_personal');
        },

        unassignedLock: function () {
            return Util.isUnassignedLock(this.userModel.toJSON(), this.model.toJSON());
        },

        updateProjectRole: function (role) {
            var newRole = role;
            config.trackingDispatcher.trackEventNumber(465);
            memberService.updateMember(newRole, this.userModel.get('userId'), this.model.get('projectId'))
                .done(function () {
                    this.model.set('projectRole', newRole);
                    Util.ajaxSuccessMessenger('updateProjectRole', this.userModel.get('full_name') || this.userModel.get('userId'));
                }.bind(this))
                .fail(function (error) {
                    Util.ajaxFailMessenger(error, 'updateProjectRole');
                });
        },

        confirmUnassign: function (e) {
            var self = this;
            var modal;
            config.trackingDispatcher.trackEventNumber(466.1);
            e.preventDefault();
            modal = new ModalConfirm({
                headerText: Localization.dialogHeader.unAssignMember,
                bodyText: Util.replaceTemplate(Localization.dialog.unAssignMember, this.userModel.get('userId').escapeHtml(), this.model.get('projectId')),
                okButtonDanger: true,
                cancelButtonText: Localization.ui.cancel,
                okButtonText: Localization.ui.unassign,
                confirmFunction: function () {
                    return self.unAssign();
                }
            });
            modal.show();
        },
        redirectToProject: function (e) {
            config.router.navigate('#administrate/project-details/' + this.model.get('projectId'), { trigger: true });
        },
        unAssign: function () {
            return CallService.call('PUT', Urls.updateProjectUnassign(this.model.get('projectId')), { userNames: [this.userModel.get('userId')] })
                .done(function () {
                    Util.ajaxSuccessMessenger('unAssignMember');
                    if (this.model.collection) {
                        this.model.collection.remove(this.model);
                    }
                }.bind(this))
                .fail(function (error) {
                    Util.ajaxFailMessenger(error, 'unAssignMember');
                });
        },

        onDestroy: function () {
            this.projectRoleSelector.destroy();
            this.$el.html('');
            delete this;
        }
    });

    return MembersItemView;
});
