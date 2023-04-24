// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { Heading } from '../../shared/heading';
import { PageMainLayoutTitle } from '../../shared/page-main-layout/PageMainLayoutTitle';
import { Text } from '../../shared/text';
import { useQredoUIPendingRequest } from './hooks';
import { isUntrustedQredoConnect } from './utils';
import { LabelValueItem } from '_components/LabelValueItem';
import { LabelValuesContainer } from '_components/LabelValuesContainer';
import { SummaryCard } from '_components/SummaryCard';
import { UserApproveContainer } from '_components/user-approve-container';

export function QredoConnectInfoPage() {
    const { requestID } = useParams();
    const { data, isLoading } = useQredoUIPendingRequest(requestID);
    const isUntrusted = useMemo(
        () => !!data && isUntrustedQredoConnect(data),
        [data]
    );
    const [isUntrustedAccepted, setIsUntrustedAccepted] = useState(false);
    const navigate = useNavigate();
    if (isLoading) {
        return null;
    }
    if (!data) {
        window.close();
        return null;
    }
    const showUntrustedWarning = isUntrusted && !isUntrustedAccepted;
    return (
        <>
            <PageMainLayoutTitle title="Qredo Accounts Setup" />
            <UserApproveContainer
                approveTitle="Continue"
                rejectTitle="Reject"
                isWarning={showUntrustedWarning}
                origin={data.origin}
                originFavIcon={data.originFavIcon}
                onSubmit={async (approved) => {
                    if (approved) {
                        if (showUntrustedWarning) {
                            setIsUntrustedAccepted(true);
                        } else {
                            navigate('./select', { state: { reviewed: true } });
                        }
                    } else {
                        window.close();
                    }
                }}
                addressHidden
            >
                <SummaryCard
                    header={showUntrustedWarning ? '' : 'More information'}
                    body={
                        showUntrustedWarning ? (
                            <div className="flex flex-col gap-2.5">
                                <Heading
                                    variant="heading6"
                                    weight="semibold"
                                    color="gray-90"
                                >
                                    Your Connection Is Not Secure
                                </Heading>
                                <Text
                                    variant="pBodySmall"
                                    weight="medium"
                                    color="steel-darker"
                                >
                                    If you connect your wallet with this site
                                    your data could be exposed to attackers.
                                </Text>
                                <div className="mt-2.5">
                                    <Text
                                        variant="pBodySmall"
                                        weight="medium"
                                        color="steel-darker"
                                    >
                                        Click **Reject** if you don't trust this
                                        site. Continue at your own risk.
                                    </Text>
                                </div>
                            </div>
                        ) : (
                            <LabelValuesContainer>
                                <LabelValueItem
                                    label="Service"
                                    value={data.service}
                                />
                                <LabelValueItem
                                    label="Token"
                                    value={data.partialToken}
                                />
                                <LabelValueItem
                                    label="API URL"
                                    value={data.apiUrl}
                                />
                            </LabelValuesContainer>
                        )
                    }
                    fullHeight={showUntrustedWarning}
                />
            </UserApproveContainer>
        </>
    );
}
