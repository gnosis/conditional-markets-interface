import * as React from 'react';
// ?: () => void
export interface IProps {
  childrenStyle?: string;
  cardStyle?: string;
  headerOutside?: boolean;
  heading?: string;
  styleName: string;
}

const CardBox: React.StatelessComponent<IProps> = ({heading, styleName, cardStyle, childrenStyle, headerOutside}) => (
        <div className={`${styleName}`}>
            {headerOutside &&
            <div className="jr-entry-header">
                <h3 className="entry-heading heading">{heading}</h3>
            </div>
            }

            <div className={`jr-card ${cardStyle}`}>
                {!headerOutside &&
                ( heading &&
                    <div className="jr-card-header">
                        <h3 className="card-heading">{heading}</h3>
                    </div>
                )}
                <div className={`jr-card-body ${childrenStyle}`}/>
            </div>
        </div>
);

export default CardBox;
//
CardBox.defaultProps = {
    cardStyle: '',
    childrenStyle: '',
    styleName: 'col-lg-6 col-sm-12'
};
