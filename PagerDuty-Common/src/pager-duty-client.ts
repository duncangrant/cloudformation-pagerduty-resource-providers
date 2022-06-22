import axios, {AxiosResponse} from "axios";
import {CaseTransformer, transformObjectCase} from "./util";

export type ApiErrorResponse = {
    error: ApiError
}
export type ApiError = {
    code: number
    message: string
    errors?: string[]
}
export type PaginatedResponseType = {
    offset: number
    limit: number
    more: boolean
    total: number
}

export class PagerDutyClient {
    private readonly apiToken: string;

    constructor(apiToken: string) {
        this.apiToken = apiToken;
    }

    public async doRequest<ResponseType>(method: 'get' | 'put' | 'post' | 'delete', path: string, params: any = {}, body?: {}): Promise<AxiosResponse<ResponseType>> {
        return await axios.request<ResponseType>({
            url: `https://api.pagerduty.com${path}`,
            params: params,
            method: method,
            data: transformObjectCase(body, CaseTransformer.PASCAL_TO_SNAKE),
            headers: {
                Authorization: `Token token=${this.apiToken}`,
                'Content-type': 'application/json',
                Accept: 'application/vnd.pagerduty+json;version=2',
                From: ''
            }
        });
    }

    public async paginate<ResponseType extends PaginatedResponseType, ResultType>(method: 'get' | 'put' | 'post' | 'delete', path: string, transform: (response: AxiosResponse<ResponseType>) => ResultType[], params: any = {}, body?: {}): Promise<ResultType[]> {
        const results: ResultType[] = [];

        let page = 1;
        let delegateParams = {
            offset: 0,
            limit: 200,
            ...params
        };

        while (delegateParams.offset >= 0) {
            const response = await this.doRequest<ResponseType>(method, path, delegateParams, body);
            results.push(...transform(response))
            delegateParams = {
                ...delegateParams,
                offset: response.data && response.data.more === true ? response.data.limit * page : -1
            };
            page++;
        }

        return results;
    }
}