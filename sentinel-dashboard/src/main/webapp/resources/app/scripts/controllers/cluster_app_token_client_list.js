var app = angular.module('sentinelDashboardApp');

app.controller('SentinelClusterAppTokenClientListController', ['$scope', '$stateParams', 'ngDialog',
    'MachineService', 'ClusterStateService',
    function ($scope, $stateParams, ngDialog, MachineService, ClusterStateService) {
        $scope.app = $stateParams.app;

        const UNSUPPORTED_CODE = 4041;
        const CLUSTER_MODE_CLIENT = 0;
        const CLUSTER_MODE_SERVER = 1;

        function processClientData(clientVO) {

        }

        $scope.modifyClientConfigDialog = (clientVO) => {
            if (!clientVO) {
                return;
            }
            $scope.ccDialogData = {
                ip: clientVO.ip,
                commandPort: clientVO.commandPort,
                clientId: clientVO.id,
                serverHost: clientVO.state.clientConfig.serverHost,
                serverPort: clientVO.state.clientConfig.serverPort,
                requestTimeout: clientVO.state.clientConfig.requestTimeout,
            };
            $scope.ccDialog = ngDialog.open({
                template: '/app/views/dialog/cluster/cluster-client-config-dialog.html',
                width: 700,
                overlay: true,
                scope: $scope
            });
        };

        function checkValidClientConfig(config) {
            if (!config.serverHost || config.serverHost.trim() == '') {
                alert('Please enter a valid Token Server IP');
                return false;
            }
            if (config.serverPort === undefined || config.serverPort <= 0 ||  config.serverPort > 65535) {
                alert('Please enter a valid Token Server port');
                return false;
            }
            if (config.requestTimeout === undefined || config.requestTimeout <= 0) {
                alert('Please enter a valid request timeout period');
                return false;
            }
            return true;
        }

        $scope.doModifyClientConfig = () => {
            if (!checkValidClientConfig($scope.ccDialogData)) {
                return;
            }
            let id = $scope.ccDialogData.id;
            let request = {
                app: $scope.app,
                ip: $scope.ccDialogData.ip,
                port: $scope.ccDialogData.commandPort,
                mode: CLUSTER_MODE_CLIENT,
                clientConfig: {
                    serverHost: $scope.ccDialogData.serverHost,
                    serverPort: $scope.ccDialogData.serverPort,
                    requestTimeout: $scope.ccDialogData.requestTimeout,
                }
            };
            ClusterStateService.modifyClusterConfig(request).success((data) => {
                if (data.code === 0 && data.data) {
                    alert('Modify the Token Client configuration successfully');
                    window.location.reload();
                } else {
                    if (data.code === UNSUPPORTED_CODE) {
                        alert('Server ' + id + ' Sentinel does not introduce cluster current limiting client, please upgrade to version 1.4.0 or later and introduce related dependencies.');
                    } else {
                        alert('fail to edit：' + data.msg);
                    }
                }
            }).error((data, header, config, status) => {
                alert('Unknown Error');
            });
        };

        function retrieveClusterTokenClientInfo() {
            ClusterStateService.fetchClusterClientStateOfApp($scope.app)
                .success((data) => {
                    if (data.code === 0 && data.data) {
                        $scope.loadError = undefined;
                        $scope.clientVOList = data.data;
                        $scope.clientVOList.forEach(processClientData);
                    } else {
                        $scope.clientVOList = [];
                        if (data.code === UNSUPPORTED_CODE) {
                            $scope.loadError = {message: 'The Sentinel client of this application does not support cluster current limiting, please upgrade to version 1.4.0 or later and introduce related dependencies. '}
                        } else {
                            $scope.loadError = {message: data.msg};
                        }
                    }
                })
                .error(() => {
                    $scope.loadError = {message: 'Unknown Error'};
                });
        }

        retrieveClusterTokenClientInfo();

        $scope.macsInputConfig = {
            searchField: ['text', 'value'],
            persist: true,
            create: false,
            maxItems: 1,
            render: {
                item: function (data, escape) {
                    return '<div>' + escape(data.text) + '</div>';
                }
            },
            onChange: function (value, oldValue) {
                $scope.macInputModel = value;
            }
        };
    }]);
