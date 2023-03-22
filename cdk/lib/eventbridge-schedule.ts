import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import { Role } from "aws-cdk-lib/aws-iam";
import {CfnSchedule} from "aws-cdk-lib/aws-scheduler";
import {Options} from "../types/options";

interface EventBridgeSchedulerProps extends cdk.NestedStackProps {
    options: Options;
    stateMachineArn: string
    schedulerRoleArn: string
}

export class EventBridgeSchedule extends cdk.NestedStack {
    private readonly role: Role;

    constructor(scope: Construct, id: string, props: EventBridgeSchedulerProps) {
        super(scope, id, props);

        // Start ECS Instance 8 am Central Time
        new CfnSchedule(this,"legacy-app-scheduler", {
            name: "legacy-app-scheduler",
            flexibleTimeWindow: {
                mode: "OFF"
            },
            scheduleExpression: "cron(0 20 ? * * *)",
            scheduleExpressionTimezone: 'America/Chicago',
            description: 'Event that start LegacyApp StepFunction',
            target: {
                arn: props.stateMachineArn,
                roleArn: props.schedulerRoleArn
            },
        });
    }
}
