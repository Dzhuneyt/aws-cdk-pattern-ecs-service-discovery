import {Construct, Duration} from "@aws-cdk/core";
import {
    ContainerImage,
    FargatePlatformVersion,
    FargateService,
    FargateTaskDefinition,
    ICluster,
    LogDriver,
    Protocol
} from "@aws-cdk/aws-ecs";
import {DnsRecordType, PrivateDnsNamespace} from "@aws-cdk/aws-servicediscovery";
import * as path from "path";
import {RetentionDays} from "@aws-cdk/aws-logs";
import {Port} from "@aws-cdk/aws-ec2";

export class AuthMicroservice extends Construct {
    service: FargateService;

    constructor(scope: Construct, id: string, private props: {
        cluster: ICluster,
        cloudMapNamespace: PrivateDnsNamespace,
    }) {
        super(scope, id);

        const taskDefinition = new FargateTaskDefinition(this, 'FargateTaskDefinition', {
            memoryLimitMiB: 512,
            cpu: 256,
        });
        taskDefinition.addContainer("web", {
            // Use an image from DockerHub
            image: ContainerImage.fromAsset(path.resolve(__dirname, "./../../../microservices/auth")),
            portMappings: [
                {
                    containerPort: 80,
                    protocol: Protocol.TCP,
                    hostPort: 80,
                },
            ],
            logging: LogDriver.awsLogs({
                logRetention: RetentionDays.ONE_MONTH,
                streamPrefix: "web",
            }),
        });

        this.service = new FargateService(this, 'FargateService', {
            cluster: props.cluster,
            taskDefinition,
            assignPublicIp: true,
            platformVersion: FargatePlatformVersion.VERSION1_4,
            maxHealthyPercent: 300,
            minHealthyPercent: 100,
            capacityProviderStrategies: [
                {
                    capacityProvider: 'FARGATE_SPOT',
                    weight: 2,
                },
                {
                    capacityProvider: 'FARGATE',
                    weight: 1,
                }
            ],
        });

        const cloudMapService = props.cloudMapNamespace.createService('auth', {
            dnsRecordType: DnsRecordType.A,
            dnsTtl: Duration.seconds(1),
            name: 'auth',
        });
        this.service.associateCloudMapService({
            service: cloudMapService,
        })

        this.service.connections.allowFromAnyIpv4(Port.allTraffic());
    }
}
