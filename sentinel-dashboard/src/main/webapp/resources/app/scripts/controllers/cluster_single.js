var app = angular.module('sentinelDashboardApp');

app.controller('SentinelClusterSingleController', ['$scope', '$stateParams', 'ngDialog',
    'MachineService', 'ClusterStateService',
    function ($scope, $stateParams, ngDialog, MachineService, ClusterStateService) {
        $scope.app = $stateParams.app;
        const UNSUPPORTED_CODE = 4041;

        const CLUSTER_MODE_CLIENT = 0;
        const CLUSTER_MODE_SERVER = 1;

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

        function convertSetToString(set) {
            if (set === undefined) {
                return '';
            }
            let s = '';
            for (let i = 0; i < set.length; i++) {
                s = s + set[i];
                if (i < set.length - 1) {
                    s = s + ',';
                }
            }
            return s;
        }

        function convertStrToNamespaceSet(str) {
            if (str === undefined || str === '') {
                return [];
            }
            let arr = [];
            let spliced = str.split(',');
            spliced.forEach((v) => {
                arr.push(v.trim());
            });
            return arr;
        }

        function fetchMachineClusterState() {
            if (!$scope.macInputModel || $scope.macInputModel === '') {
                return;
            }
            let mac = $scope.macInputModel.split(':');
            ClusterStateService.fetchClusterUniversalStateSingle($scope.app, mac[0], mac[1]).success(function (data) {
                if (data.code == 0 && data.data) {
                    $scope.loadError = undefined;
                    $scope.stateVO = data.data;
                    $scope.stateVO.currentMode = $scope.stateVO.stateInfo.mode;
                    if ($scope.stateVO.server && $scope.stateVO.server.namespaceSet) {
                        $scope.stateVO.server.namespaceSetStr = convertSetToString($scope.stateVO.server.namespaceSet);
                    }
                } else {
                    $scope.stateVO = {};
                    if (data.code === UNSUPPORTED_CODE) {
                        $scope.loadError = {message: 'Server ' + mac[0] + ':' + mac[1] + ' The Sentinel client version does not support cluster current limiting, please upgrade to version 1.4.0 or later and introduce related dependencies.'}
                    } else {
                        $scope.loadError = {message: data.msg};
                    }
                }
            }).error((data, header, config, status) => {
                $scope.loadError = {message: 'Unknown Error'};
            });
        }

        fetchMachineClusterState();

        function checkValidClientConfig(stateVO) {
            if (!stateVO.client || !stateVO.client.clientConfig) {
                alert('invalid configuration');
                return false;
            }
            let config = stateVO.client.clientConfig;
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

        function sendClusterClientRequest(stateVO) {
            if (!checkValidClientConfig(stateVO)) {
                return;
            }
            if (!$scope.macInputModel) {
                return;
            }
            let mac = $scope.macInputModel.split(':');
            let request = {
                app: $scope.app,
                ip: mac[0],
                port: mac[1],
            };
            request.mode = CLUSTER_MODE_CLIENT;
            request.clientConfig = stateVO.client.clientConfig;
            ClusterStateService.modifyClusterConfig(request).success(function (data) {
                if (data.code == 0 && data.data) {
                    alert('Modify the cluster current limiting client configuration successfully');
                    window.location.reload();
                } else {
                    if (data.code === UNSUPPORTED_CODE) {
                        alert('Server ' + mac[0] + ':' + mac[1] + ' The Sentinel client version of the current version does not support the cluster current limit client, please upgrade to version 1.4.0 or later and introduce related dependencies.');
                    } else {
                        alert('fail to edit：' + data.msg);
                    }
                }
            }).error((data, header, config, status) => {
                alert('Unknown Error');
            });
        }

        function checkValidServerConfig(stateVO) {
            if (!stateVO.server || !stateVO.server.transport) {
                alert('invalid configuration');
                return false;
            }
            if (stateVO.server.namespaceSetStr === undefined || stateVO.server.namespaceSetStr == '') {
                alert('Please enter a valid set of namespaces (multiple namespaces are separated by , )');
                return false;
            }
            let transportConfig = stateVO.server.transport;
            if (transportConfig.port === undefined || transportConfig.port <= 0 || transportConfig.port > 65535) {
                alert('Please enter a valid Token Server port');
                return false;
            }
            let flowConfig = stateVO.server.flow;
            if (flowConfig.maxAllowedQps === undefined || flowConfig.maxAllowedQps < 0) {
                alert('Please enter a valid maximum allowed QPS');
                return false;
            }
            // if (transportConfig.idleSeconds === undefined || transportConfig.idleSeconds <= 0) {
            //     alert('Please enter a valid connection cleanup duration (idleSeconds)');
            //     return false;
            // }
            return true;
        }

        function sendClusterServerRequest(stateVO) {
            if (!checkValidServerConfig(stateVO)) {
                return;
            }
            if (!$scope.macInputModel) {
                return;
            }
            let mac = $scope.macInputModel.split(':');
            let request = {
                app: $scope.app,
                ip: mac[0],
                port: mac[1],
            };
            request.mode = CLUSTER_MODE_SERVER;
            request.flowConfig = stateVO.server.flow;
            request.transportConfig = stateVO.server.transport;
            request.namespaceSet = convertStrToNamespaceSet(stateVO.server.namespaceSetStr);
            ClusterStateService.modifyClusterConfig(request).success(function (data) {
                if (data.code == 0 && data.data) {
                    alert('Modify the cluster current limiting server configuration successfully');
                    window.location.reload();
                } else {
                    if (data.code === UNSUPPORTED_CODE) {
                        alert('Server ' + mac[0] + ':' + mac[1] + ' The Sentinel client version does not support cluster current limiting server, please upgrade to version 1.4.0 or later and introduce related dependencies。');
                    } else {
                        alert('fail to edit：' + data.msg);
                    }
                }
            }).error((data, header, config, status) => {
                alert('Unknown Error');
            });
        }


        $scope.saveConfig = () => {
            let ok = confirm('Are you sure to modify the cluster throttling configuration?');
            if (!ok) {
                return;
            }
            let mode = $scope.stateVO.stateInfo.mode;
            if (mode != 1 && mode != 0) {
                alert('Unknown cluster throttling mode');
                return;
            }
            if (mode == 0) {
                sendClusterClientRequest($scope.stateVO);
            } else {
                sendClusterServerRequest($scope.stateVO);
            }
        };

        function queryAppMachines() {
            MachineService.getAppMachines($scope.app).success(
                function (data) {
                    if (data.code === 0) {
                        // $scope.machines = data.data;
                        if (data.data) {
                            $scope.machines = [];
                            $scope.macsInputOptionsOrigin = [];
                            $scope.macsInputOptions = [];
                            data.data.forEach(function (item) {
                                if (item.healthy) {
                                    $scope.macsInputOptionsOrigin.push({
                                        text: item.ip + ':' + item.port,
                                        value: item.ip + ':' + item.port
                                    });
                                }
                            });
                            $scope.macsInputOptions = $scope.macsInputOptionsOrigin;
                        }
                        if ($scope.macsInputOptions.length > 0) {
                            $scope.macInputModel = $scope.macsInputOptions[0].value;
                        }
                    } else {
                        $scope.macsInputOptions = [];
                    }
                }
            );
        }
        queryAppMachines();

        $scope.$watch('searchKey', function () {
            if (!$scope.macsInputOptions) {
                return;
            }
            if ($scope.searchKey) {
                $scope.macsInputOptions = $scope.macsInputOptionsOrigin
                    .filter((e) => e.value.indexOf($scope.searchKey) !== -1);
            } else {
                $scope.macsInputOptions = $scope.macsInputOptionsOrigin;
            }
            if ($scope.macsInputOptions.length > 0) {
                $scope.macInputModel = $scope.macsInputOptions[0].value;
            } else {
                $scope.macInputModel = '';
            }
        });

        $scope.$watch('macInputModel', function () {
            if ($scope.macInputModel) {
                fetchMachineClusterState();
            }
        });
    }]);
