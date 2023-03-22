import { Construct } from "constructs";
import { StackProps} from "aws-cdk-lib";
import * as sf from "aws-cdk-lib/aws-stepfunctions";
import { LogLevel, StateMachineType } from "aws-cdk-lib/aws-stepfunctions";
import { Options } from "../types/options";
import * as fs from "fs";
import * as path from "path";
import * as logs from "aws-cdk-lib/aws-logs";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import { ITopic } from "aws-cdk-lib/aws-sns";
import {StateMachineExecutionRole} from "./state-machine-access-role";
import {Table} from "aws-cdk-lib/aws-dynamodb";


interface LegacyAppMachineProps extends StackProps {
    options: Options;
    table: Table,
    topic: ITopic
    role: StateMachineExecutionRole
}

export class LegacyAppStateMachine extends Construct {
    private readonly _stateMachine: sf.CfnStateMachine;

    get stateMachine(): sf.CfnStateMachine {
        return this._stateMachine;
    }

    constructor(scope: Construct, id: string, props: LegacyAppMachineProps) {
        super(scope, id);

        const file = fs.readFileSync(
            path.resolve(__dirname, "../../statemachine/legacyApp.json")
        );


        // State Machine LogGroup
        const logGroup = new logs.LogGroup(
            this,
            '/aws/vendedlogs/states/legacy-app',
            {
                retention: RetentionDays.ONE_DAY,
            }
        );


        this._stateMachine = new sf.CfnStateMachine(
            this,
            'legacy-app-state-machine',
            {
                stateMachineName: "legacy-app-state-machine",
                stateMachineType: StateMachineType.EXPRESS,
                roleArn: props.role.roleArn,
                definitionString: file.toString(),
                definitionSubstitutions: {
                    LegacyAppSNSPath: props.topic.topicArn
                },

                loggingConfiguration: {
                    destinations: [
                        {
                            cloudWatchLogsLogGroup: {
                                logGroupArn: logGroup.logGroupArn,
                            },
                        },
                    ],
                    includeExecutionData: true,
                    level: LogLevel.ALL,
                },
            }
        );
    }
}
